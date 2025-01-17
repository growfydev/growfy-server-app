import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/core/prisma.service';
import { GlobalStatus, ShopifyIntegration } from '@prisma/client';
import { omit } from 'lodash';
import dayjs from 'dayjs';
import { Service } from 'src/service';

@Injectable()
export class ShopifyDataService extends Service {
	constructor(private readonly prisma: PrismaService) {
		super(ShopifyDataService.name);
	}

	async getShop(profileId: number): Promise<ShopifyIntegration> {
		const integration = await this.getActiveIntegration(profileId);

		if (!integration) {
			throw new BadRequestException(
				'No se encontró una integración para este perfil.',
			);
		}

		return omit(integration, ['accessToken', 'code']) as ShopifyIntegration;
	}

	async getCustomers(profileId: number) {
		const integration = await this.getActiveIntegration(profileId);

		if (!integration) {
			throw new BadRequestException(
				'No se encontró una integración activa para este perfil.',
			);
		}

		const customers = await this.prisma.customer.findMany({
			where: {
				profileId: integration.profileId,
				globalStatus: GlobalStatus.ACTIVE,
				AND: [
					{
						shopifyCustomerId: {
							not: null,
						},
					},
					{
						shopifyCustomerId: {
							not: '',
						},
					},
				],
			},
		});

		return customers;
	}

	async getNewVsReturningCustomer(
		profileId: number,
		startDate: string,
		endDate: string,
	) {
		if (!this.areValidDates(startDate, endDate)) {
			throw new BadRequestException(
				'Las fechas proporcionadas son inválidas.',
			);
		}

		// Obtener todos los clientes asociados al perfil
		const customers = await this.prisma.customer.findMany({
			where: {
				profileId,
				globalStatus: GlobalStatus.ACTIVE,
				AND: [
					{
						shopifyCustomerId: {
							not: null,
						},
					},
					{
						shopifyCustomerId: {
							not: '',
						},
					},
				],
			},
			include: {
				ShopifyOrder: {
					where: {
						shopifyCreatedAt: {
							gte: dayjs(startDate).startOf('day').toDate(),
							lte: dayjs(endDate).endOf('day').toDate(),
						},
					},
				},
			},
		});

		// Dividir clientes en nuevos y recurrentes
		const newCustomers = customers.filter(
			(customer) => customer.ShopifyOrder.length === 1,
		);
		const returningCustomers = customers.filter(
			(customer) => customer.ShopifyOrder.length > 1,
		);

		// Calcular porcentajes
		const totalCustomers = customers.length;
		const newPercentage = (
			(newCustomers.length / totalCustomers) *
			100
		).toFixed(1);
		const returningPercentage = (
			(returningCustomers.length / totalCustomers) *
			100
		).toFixed(1);

		return {
			totalCustomers,
			newCustomers: newCustomers.length,
			returningCustomers: returningCustomers.length,
			newPercentage: `${newPercentage}%`,
			returningPercentage: `${returningPercentage}%`,
		};
	}

	async getProducts(profileId: number) {
		const integration = await this.getActiveIntegration(profileId);

		if (!integration) {
			throw new BadRequestException(
				'No se encontró una integración activa para este perfil.',
			);
		}

		const products = await this.prisma.shopifyProduct.findMany({
			where: {
				shopifyIntegrationId: integration.id,
				globalStatus: GlobalStatus.ACTIVE,
			},
		});

		return products;
	}

	async getLowInventory(profileId: number) {
		const integration = await this.getActiveIntegration(profileId);

		if (!integration) {
			throw new BadRequestException(
				'No se encontró una integración activa para este perfil.',
			);
		}

		const products = await this.prisma.shopifyProduct.findMany({
			where: {
				shopifyIntegrationId: integration.id,
				globalStatus: GlobalStatus.ACTIVE,
				totalInventory: {
					lt: 5,
				},
			},
		});

		return products;
	}

	async getOrders(profileId: number, startDate: string, endDate: string) {
		if (!this.areValidDates(startDate, endDate)) {
			throw new BadRequestException(
				'Las fechas proporcionadas son inválidas.',
			);
		}

		const integration = await this.getActiveIntegration(profileId);

		if (!integration) {
			throw new BadRequestException(
				'No se encontró una integración activa para este perfil.',
			);
		}

		const orders = await this.prisma.shopifyOrder.findMany({
			where: {
				shopifyIntegrationId: integration.id,
				shopifyCreatedAt: {
					gte: dayjs(startDate).startOf('day').toDate(),
					lte: dayjs(endDate).endOf('day').toDate(),
				},
				globalStatus: GlobalStatus.ACTIVE,
			},
			include: {
				ShopifyLineItem: {
					include: {
						shopifyProduct: true,
					},
				},
				Customer: true,
			},
		});

		const totalOrders = orders.length;

		const totalRevenue = orders
			.reduce((acc, order) => acc + Number(order.totalPrice), 0)
			.toFixed(2);

		const avgOrderValue = (Number(totalRevenue) / totalOrders).toFixed(2);

		// Calcular los productos más vendidos
		const productSales: {
			[key: string]: {
				name: string;
				units: number;
				revenue: number;
				inventory: number;
				ProductId: string;
			};
		} = {};

		orders.forEach((order) => {
			order.ShopifyLineItem.forEach((lineItem) => {
				if (!lineItem.shopifyProduct) return;

				const { title: productName, totalInventory } =
					lineItem.shopifyProduct;
				const lineRevenue = Number(
					lineItem.discountedTotal || lineItem.originalTotal || 0,
				);
				const lineUnits = lineItem.quantity || 0;

				if (!productSales[lineItem.shopifyProductId]) {
					productSales[lineItem.shopifyProductId] = {
						name: productName || 'Producto desconocido',
						ProductId: lineItem.shopifyProductId,
						units: 0,
						revenue: 0,
						inventory: totalInventory || 0,
					};
				}

				productSales[lineItem.shopifyProductId].units += lineUnits;
				productSales[lineItem.shopifyProductId].revenue += lineRevenue;
			});
		});

		const topProducts = Object.values(productSales)
			.sort((a, b) => b.units - a.units)
			.slice(0, 3);

		const lowInventoryProducts = topProducts.filter(
			(p) => p.inventory < 10,
		);

		// Calcular el comportamiento del cliente
		let newCustomers = 0;
		let returningCustomers = 0;

		for (const order of orders) {
			const customerId = order.Customer?.shopifyCustomerId;
			if (!customerId) continue;

			const previousOrders = await this.prisma.shopifyOrder.count({
				where: {
					shopifyCustomerId: customerId,
					shopifyCreatedAt: {
						lt: dayjs(startDate).startOf('day').toDate(),
					},
					globalStatus: GlobalStatus.ACTIVE,
				},
			});

			if (previousOrders > 0) {
				returningCustomers++;
			} else {
				newCustomers++;
			}
		}

		const totalCustomers = newCustomers + returningCustomers;
		const newCustomerPercentage = (
			(newCustomers / totalCustomers) *
			100
		).toFixed(0);
		const returningCustomerPercentage = (
			(returningCustomers / totalCustomers) *
			100
		).toFixed(0);

		return {
			stats: {
				currency: integration.shopCurrency,
				totalOrders,
				totalRevenue: isNaN(Number(totalRevenue))
					? 0
					: Number(totalRevenue),
				avgOrderValue: isNaN(Number(avgOrderValue))
					? 0
					: Number(avgOrderValue),
				products: {
					topProducts: topProducts.map((p, index) => ({
						productId: p.ProductId,
						rank: index + 1,
						name: p.name,
						units: p.units,
						revenue: isNaN(p.revenue) ? '0' : p.revenue.toFixed(0),
					})),
					lowInventory: lowInventoryProducts.map((p) => ({
						productId: p.ProductId,
						name: p.name,
						inventory: p.inventory,
					})),
				},
				customers: {
					totalCustomers,
					newCustomers,
					returningCustomers,
					newCustomerPercentage: isNaN(Number(newCustomerPercentage))
						? '0%'
						: `${newCustomerPercentage}%`,
					returningCustomerPercentage: isNaN(
						Number(returningCustomerPercentage),
					)
						? '0%'
						: `${returningCustomerPercentage}%`,
				},
			},
			orders,
		};
	}

	private areValidDates(startDate: string, endDate: string): boolean {
		if (
			!dayjs(startDate, 'YYYY-MM-DD', true).isValid() ||
			!dayjs(endDate, 'YYYY-MM-DD', true).isValid()
		) {
			return false;
		}
		return !dayjs(startDate).isAfter(dayjs(endDate));
	}

	private async getActiveIntegration(
		profileId: number,
	): Promise<ShopifyIntegration> {
		const integration = await this.prisma.shopifyIntegration.findFirst({
			where: {
				Profile: { id: profileId },
				isAuth: true,
				globalStatus: GlobalStatus.ACTIVE,
			},
		});

		if (!integration) {
			throw new BadRequestException(
				'No se encontró una integración activa para este perfil.',
			);
		}

		return integration;
	}

	/**
	 private processOrdersData(ordersData: any) {
		const orders = ordersData?.orders?.edges || [];
		const aggregatedData = {};

		for (const orderEdge of orders) {
			const order = orderEdge.node;
			const date = dayjs(order.processedAt).format('YYYY-MM-DD');
			const hour = dayjs(order.processedAt).format('HH');
			const revenue = parseFloat(order.totalPriceSet.shopMoney.amount);

			if (!aggregatedData[date]) {
				aggregatedData[date] = {
					date,
					orders: 0,
					revenue: 0,
					hourlyOrders: {},
				};
			}

			aggregatedData[date].orders += 1;
			aggregatedData[date].revenue += revenue;
			aggregatedData[date].hourlyOrders[hour] =
				(aggregatedData[date].hourlyOrders[hour] || 0) + 1;
		}

		return Object.values(aggregatedData).map((dayData: any) => {
			const peakHourEntry = Object.entries(dayData.hourlyOrders).reduce(
				(max, entry) => (entry[1] > max[1] ? entry : max),
				['', 0],
			);

			return {
				date: dayData.date,
				orders: dayData.orders,
				revenue: dayData.revenue,
				avgOrderValue: dayData.revenue / dayData.orders,
				peakHour: peakHourEntry[0] || null,
				peakHourOrders: peakHourEntry[1] || 0,
			};
		});
	}
	 */
}
