import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/prisma.service';
import { Service } from 'src/service';
import { CronTask } from '../tasks/cron/cron.decorator';
import dayjs from 'dayjs';
import { GlobalStatus } from '@prisma/client';

@Injectable()
export class ShopifyCronService extends Service {
	constructor(private readonly prisma: PrismaService) {
		super(ShopifyCronService.name);
	}

	@CronTask('* * * * *')
	async saveDailyStats() {
		this.logger.log('Ejecutando tarea');
		console.error('Ejecutando tarea');
		try {
			const start = dayjs().subtract(1, 'day').startOf('day').toDate();
			const end = dayjs().subtract(1, 'day').endOf('day').toDate();

			this.logger.log(
				`Starting daily stats calculation for date: ${start.toISOString()}`,
			);

			const integrations = await this.prisma.shopifyIntegration.findMany({
				where: {
					globalStatus: 'ACTIVE',
					isAuth: true,
				},
				select: {
					id: true,
					shopCurrency: true,
				},
			});

			if (!integrations.length) {
				this.logger.warn(
					'No active integrations found for daily stats calculation',
				);
				return;
			}

			this.logger.log(
				`Processing ${integrations.length} active integrations`,
			);

			for (const integration of integrations) {
				try {
					this.logger.debug(
						`Processing integration ID: ${integration.id}`,
					);

					// Optimized single query to get orders with all related data
					const orders = await this.prisma.shopifyOrder.findMany({
						where: {
							shopifyIntegrationId: integration.id,
							shopifyCreatedAt: {
								gte: start,
								lte: end,
							},
							globalStatus: GlobalStatus.ACTIVE,
						},
						include: {
							ShopifyLineItem: {
								include: {
									shopifyProduct: {
										select: {
											title: true,
											totalInventory: true,
										},
									},
								},
							},
							Customer: {
								select: {
									shopifyCustomerId: true,
								},
							},
						},
					});

					if (!orders.length) {
						this.logger.warn(
							`No orders found for integration ${integration.id} on ${start.toISOString()}`,
						);
						continue;
					}

					// Get all unique customer IDs from orders
					const customerIds = [
						...new Set(
							orders
								.map(
									(order) =>
										order.Customer?.shopifyCustomerId,
								)
								.filter((id) => id),
						),
					];

					// Single query to get previous orders count for all customers
					const previousOrdersCounts =
						await this.prisma.shopifyOrder.groupBy({
							by: ['shopifyCustomerId'],
							where: {
								shopifyCustomerId: {
									in: customerIds as string[],
								},
								shopifyCreatedAt: {
									lt: start,
								},
								globalStatus: GlobalStatus.ACTIVE,
							},
							_count: true,
						});

					const previousOrdersMap = new Map(
						previousOrdersCounts.map((count) => [
							count.shopifyCustomerId,
							count._count,
						]),
					);

					// Calculate statistics
					const totalOrders = orders.length;
					const totalRevenue = orders.reduce(
						(acc, order) => acc + Number(order.totalPrice),
						0,
					);
					const avgOrderValue =
						totalOrders > 0 ? totalRevenue / totalOrders : 0;

					// Process product sales
					const productSales = orders.reduce(
						(acc, order) => {
							order.ShopifyLineItem.forEach((lineItem) => {
								if (!lineItem.shopifyProduct) return;

								const productId = lineItem.shopifyProductId;
								if (!acc[productId]) {
									acc[productId] = {
										name:
											lineItem.shopifyProduct.title ||
											'Producto desconocido',
										ProductId: productId,
										units: 0,
										revenue: 0,
										inventory:
											lineItem.shopifyProduct
												.totalInventory || 0,
									};
								}
								acc[productId].units += lineItem.quantity || 0;
								acc[productId].revenue += Number(
									lineItem.discountedTotal ||
										lineItem.originalTotal ||
										0,
								);
							});
							return acc;
						},
						{} as Record<string, any>,
					);

					const topProducts = Object.values(productSales)
						.sort((a, b) => b.units - a.units)
						.slice(0, 3);

					const lowInventoryProducts = topProducts.filter(
						(p) => p.inventory < 10,
					);

					// Calculate customer metrics
					const customerMetrics = customerIds.reduce(
						(acc, customerId) => {
							if (previousOrdersMap.get(customerId)) {
								acc.returningCustomers++;
							} else {
								acc.newCustomers++;
							}
							return acc;
						},
						{ newCustomers: 0, returningCustomers: 0 },
					);

					const totalCustomers =
						customerMetrics.newCustomers +
						customerMetrics.returningCustomers;
					const stats = {
						currency: integration.shopCurrency,
						totalOrders,
						totalRevenue: Number(totalRevenue.toFixed(2)),
						avgOrderValue: Number(avgOrderValue.toFixed(2)),
						products: {
							topProducts: topProducts.map((p, index) => ({
								productId: p.ProductId,
								rank: index + 1,
								name: p.name,
								units: p.units,
								revenue: Number(p.revenue.toFixed(0)),
							})),
							lowInventory: lowInventoryProducts.map((p) => ({
								productId: p.ProductId,
								name: p.name,
								inventory: p.inventory,
							})),
						},
						customers: {
							totalCustomers,
							newCustomers: customerMetrics.newCustomers,
							returningCustomers:
								customerMetrics.returningCustomers,
							newCustomerPercentage: `${totalCustomers ? ((customerMetrics.newCustomers / totalCustomers) * 100).toFixed(0) : 0}%`,
							returningCustomerPercentage: `${totalCustomers ? ((customerMetrics.returningCustomers / totalCustomers) * 100).toFixed(0) : 0}%`,
						},
					};

					await this.prisma.shopifyDailyStats.create({
						data: {
							shopifyIntegrationId: integration.id,
							date: start,
							...stats,
						},
					});

					this.logger.log(
						`Successfully processed stats for integration ${integration.id}`,
					);
				} catch (integrationError) {
					this.logger.error(
						`Error processing integration ${integration.id}:`,
						{
							error: integrationError.message,
							stack: integrationError.stack,
						},
					);
				}
			}

			this.logger.log('Daily stats calculation completed successfully');
		} catch (error) {
			this.logger.error('Failed to complete daily stats calculation:', {
				error: error.message,
				stack: error.stack,
			});
			throw error;
		}
	}
}
