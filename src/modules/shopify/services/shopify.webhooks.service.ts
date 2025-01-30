import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/prisma.service';
import { Service } from 'src/service';
import {
	ShopifyOrder,
	ShopifyOrderDelete,
	ShopifyCustomer,
	ShopifyProduct,
	ShopifyProductDelete,
	ShopifyCheckout,
} from '../restapi/types';
import {
	GlobalStatus,
	ShopifyCheckoutStatus,
	ShopifyIntegration,
} from '@prisma/client';
import { parseOrder } from '../restapi/orders';
import { parseCustomer } from '../restapi/customers';
import { parseProduct } from '../restapi/products';
import { parseCheckout } from '../restapi/checkouts';

@Injectable()
export class ShopifyWebhookService extends Service {
	constructor(private readonly prisma: PrismaService) {
		super(ShopifyWebhookService.name);
	}

	async customerCreateOrUpdate(shop: string, body: ShopifyCustomer) {
		const integration = await this.getIntegration(shop);
		const customer = parseCustomer(body, integration.profileId);

		const existingCustomer = await this.prisma.customer.findFirst({
			where: {
				OR: [
					{ shopifyCustomerId: customer.shopifyCustomerId },
					{ email: customer.email },
					{ phone: customer.phone },
				].filter(
					(condition) =>
						// Solo incluimos condiciones donde el valor no sea null o undefined
						Object.values(condition)[0] != null,
				),
			},
		});

		if (existingCustomer) {
			// Si existe, actualizamos
			await this.prisma.customer.update({
				where: {
					id: existingCustomer.id,
				},
				data: {
					...customer,
				},
			});
		} else {
			// Si no existe, creamos uno nuevo
			await this.prisma.customer.create({
				data: customer,
			});
		}
	}

	async customerDelete(shop: string, body: ShopifyCustomer) {
		const integration = await this.getIntegration(shop);
		const customer = parseCustomer(body, integration.profileId);

		const existingCustomer = await this.prisma.customer.findFirst({
			where: {
				shopifyCustomerId: customer.shopifyCustomerId,
			},
		});

		if (existingCustomer) {
			await this.prisma.customer.update({
				where: { id: existingCustomer.id },
				data: {
					globalStatus: GlobalStatus.DELETED,
				},
			});
		}
	}

	async productCreateOrUpdate(shop: string, body: ShopifyProduct) {
		const integration = await this.getIntegration(shop);
		const product = parseProduct(body, integration.id);
		await this.prisma.shopifyProduct.upsert({
			where: { productId: product.productId },
			update: product,
			create: product,
		});
	}

	async productDelete(shop: string, body: ShopifyProductDelete) {
		const integration = await this.getIntegration(shop);
		await this.prisma.shopifyProduct.update({
			where: {
				productId: `gid://shopify/Product/${body.id}`,
				shopifyIntegrationId: integration.id,
			},
			data: {
				globalStatus: GlobalStatus.DELETED,
			},
		});
	}

	async orderCreateOrUpdate(shop: string, body: ShopifyOrder) {
		const integration = await this.getIntegration(shop);
		const order = parseOrder(body, integration.id);

		const updatedOrCreatedOrder = await this.prisma.shopifyOrder.upsert({
			where: { orderId: order.orderId },
			update: {
				...order,
				ShopifyLineItem: undefined,
				globalStatus: [
					'REFUNDED',
					'VOIDED',
					'PARTIALLY_REFUNDED',
				].includes(order.financialStatus)
					? GlobalStatus.INACTIVE
					: GlobalStatus.ACTIVE,
			},
			create: {
				...order,
				ShopifyLineItem: undefined,
				globalStatus: [
					'REFUNDED',
					'VOIDED',
					'PARTIALLY_REFUNDED',
				].includes(order.financialStatus)
					? GlobalStatus.INACTIVE
					: GlobalStatus.ACTIVE,
			},
		});

		// Upsert de los line items asociados
		for (const lineItem of order.ShopifyLineItem) {
			await this.prisma.shopifyLineItem.upsert({
				where: { lineItemId: lineItem.lineItemId },
				update: {
					...lineItem,
					shopifyOrderId: updatedOrCreatedOrder.orderId,
				},
				create: {
					...lineItem,
					shopifyOrderId: updatedOrCreatedOrder.orderId,
				},
			});
		}

		const checkout = await this.prisma.shopifyCheckout.findFirst({
			where: {
				checkoutId: order.shopifyCheckoutId,
			},
		});

		if (checkout && checkout.status !== ShopifyCheckoutStatus.COMPLETED) {
			await this.prisma.shopifyCheckout.update({
				where: { id: checkout.id },
				data: {
					status: ShopifyCheckoutStatus.COMPLETED,
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

	async checkoutCreateOrUpdate(shop: string, body: ShopifyCheckout) {
		const integration = await this.getIntegration(shop);
		const checkout = parseCheckout(body, integration.id);

		const savedCheckout = await this.prisma.shopifyCheckout.upsert({
			where: { checkoutId: checkout.checkoutId },
			update: {
				...checkout,
				ShopifyLineItem: undefined,
			},
			create: {
				...checkout,
				ShopifyLineItem: undefined,
			},
		});

		for (const lineItem of checkout.ShopifyLineItem) {
			await this.prisma.shopifyLineItem.upsert({
				where: { lineItemId: lineItem.lineItemId },
				update: {
					...lineItem,
					shopifyCheckoutId: savedCheckout.checkoutId,
				},
				create: {
					...lineItem,
					shopifyCheckoutId: savedCheckout.checkoutId,
				},
			});
		}
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
