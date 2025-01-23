import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/prisma.service';
import { Service } from 'src/service';
import { ShopifyOrder, ShopifyOrderDelete } from '../restapi/types';
import { GlobalStatus, ShopifyIntegration } from '@prisma/client';
import { parseOrder } from '../restapi/orders';

@Injectable()
export class ShopifyWebhookService extends Service {
	constructor(private readonly prisma: PrismaService) {
		super(ShopifyWebhookService.name);
	}

	async ordersCreate(shop: string, body: ShopifyOrder) {
		const integration = await this.getIntegration(shop);

		const order = parseOrder(body, integration.id);

		// Upsert de la orden
		const createdOrder = await this.prisma.shopifyOrder.upsert({
			where: { orderId: order.orderId },
			update: {
				...order,
				ShopifyLineItem: undefined,
			},
			create: {
				...order,
				ShopifyLineItem: undefined,
			},
		});

		// Upsert de line items
		for (const lineItem of order.ShopifyLineItem) {
			await this.prisma.shopifyLineItem.upsert({
				where: { lineItemId: lineItem.lineItemId },
				update: {
					...lineItem,
					shopifyOrderId: createdOrder.orderId,
				},
				create: {
					...lineItem,
					shopifyOrderId: createdOrder.orderId,
				},
			});
		}
	}

	async ordersDelete(shop: string, body: ShopifyOrderDelete) {
		const integration = await this.getIntegration(shop);
		await this.prisma.shopifyOrder.update({
			where: {
				orderId: `gid://shopify/Order/${body.id}`,
				shopifyIntegrationId: integration.id,
			},
			data: {
				globalStatus: GlobalStatus.DELETED,
			},
		});
	}

	private async getIntegration(shop: string): Promise<ShopifyIntegration> {
		const integration = await this.prisma.shopifyIntegration.findFirst({
			where: {
				shopDomain: shop,
				isAuth: true,
				globalStatus: GlobalStatus.ACTIVE,
			},
		});

		if (!integration) {
			throw new BadRequestException(
				'No se encontró la integración autorizada para esta tienda.',
			);
		}

		return integration;
	}
}
