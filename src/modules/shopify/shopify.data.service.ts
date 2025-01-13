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

		const customersData = await this.prisma.customer.findMany({
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

		return customersData;
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

		const productsData = await this.prisma.shopifyProduct.findMany({
			where: {
				shopifyIntegrationId: integration.id,
				globalStatus: GlobalStatus.ACTIVE,
			},
		});

		return productsData;
	}

	async getLowInventory(profileId: number) {
		const integration = await this.getActiveIntegration(profileId);

		if (!integration) {
			throw new BadRequestException(
				'No se encontró una integración activa para este perfil.',
			);
		}

		const productsData = await this.prisma.shopifyProduct.findMany({
			where: {
				shopifyIntegrationId: integration.id,
				globalStatus: GlobalStatus.ACTIVE,
				totalInventory: {
					lt: 5,
				},
			},
		});

		return productsData;
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

		const ordersData = await this.prisma.shopifyOrder.findMany({
			where: {
				shopifyIntegrationId: integration.id,
				shopifyCreatedAt: {
					gte: dayjs(startDate).startOf('day').toDate(),
					lte: dayjs(endDate).endOf('day').toDate(),
				},
				globalStatus: GlobalStatus.ACTIVE,
			},
		});

		return ordersData;
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
