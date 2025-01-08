import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/core/prisma.service';
import { GlobalStatus, ShopifyIntegration } from '@prisma/client';
import { omit } from 'lodash';
import dayjs from 'dayjs';
import {
	createAdminApiClient,
	createAdminRestApiClient,
} from '@shopify/admin-api-client';
import { Service } from 'src/service';

@Injectable()
export class ShopifyDataService extends Service {
	constructor(private readonly prisma: PrismaService) {
		super(ShopifyDataService.name);
	}

	private createShopifyClient(shop: string, accessToken: string) {
		const storeDomain = shop;
		return {
			restClient: createAdminRestApiClient({
				storeDomain,
				apiVersion: '2025-01',
				accessToken,
			}),
			graphqlClient: createAdminApiClient({
				storeDomain,
				apiVersion: '2025-01',
				accessToken,
			}),
		};
	}

	async getShopInfo(profileId: number): Promise<ShopifyIntegration> {
		const integration = await this.prisma.shopifyIntegration.findFirst({
			where: {
				Profile: { id: profileId },
				isAuth: true,
				globalStatus: GlobalStatus.ACTIVE,
			},
		});

		if (!integration) {
			throw new BadRequestException(
				'No se encontró una integración para este perfil.',
			);
		}

		return omit(integration, ['accessToken', 'code']) as ShopifyIntegration;
	}

	async getShopSalesData(
		profileId: number,
		startDate: string,
		endDate: string,
	) {
		if (!this.areValidDates(startDate, endDate)) {
			throw new BadRequestException(
				'Las fechas proporcionadas son inválidas.',
			);
		}

		const integration = await this.getActiveIntegration(profileId);
		const salesData = await this.fetchSalesData(
			integration.shopDomain,
			integration.accessToken,
			startDate,
			endDate,
		);

		return this.processSalesData(salesData);
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

	private async fetchSalesData(
		shop: string,
		accessToken: string,
		startDate: string,
		endDate: string,
	): Promise<any> {
		const query = `
            query GetDailySalesData {
                orders(first: 50, query: "processed_at:>=${startDate} AND processed_at:<${endDate}T23:59:00") {
                    edges {
                        node {
                            id
                            processedAt
                            totalPriceSet {
                                shopMoney {
                                    amount
                                }
                            }
                            lineItems(first: 10) {
                                edges {
                                    node {
                                        id
                                        name
                                        quantity
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;

		const { graphqlClient } = this.createShopifyClient(shop, accessToken);
		const { data, errors } = await graphqlClient.request(query);

		if (errors?.graphQLErrors?.length) {
			throw new BadRequestException('Error al obtener datos de ventas.');
		}

		return data;
	}

	private processSalesData(salesData: any) {
		const orders = salesData?.orders?.edges || [];
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
}
