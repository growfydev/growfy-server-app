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
import { GetOrdersData } from './graphqlQueries/orders';
import { ShopifyOrdersResponse } from './graphqlQueries/types';

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

	async getShopOrdersData(
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
		const ordersData = await this.fetchOrdersData(
			integration.shopDomain,
			integration.accessToken,
			startDate,
			endDate,
		);

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

	private async fetchOrdersData(
		shop: string,
		accessToken: string,
		startDate: string,
		endDate: string,
	): Promise<ShopifyOrdersResponse> {
		const query = GetOrdersData(startDate, endDate);

		const { graphqlClient } = this.createShopifyClient(shop, accessToken);
		const { data, errors } =
			await graphqlClient.request<ShopifyOrdersResponse>(query);

		if (errors?.graphQLErrors?.length) {
			console.error(JSON.stringify(errors.graphQLErrors, null, 2));
			throw new BadRequestException('Error al obtener datos de órdenes.');
		}

		return data;
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
