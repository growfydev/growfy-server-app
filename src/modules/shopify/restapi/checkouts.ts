import { Prisma } from '@prisma/client';
import { ShopifyCheckout } from './types';

const parseCheckout = (
	checkout: ShopifyCheckout,
	shopifyIntegrationId: number,
) => {
	return {
		checkoutId: checkout.id ? String(checkout.id) : null,
		currency: checkout.currency || null,
		totalPrice: checkout.total_price
			? new Prisma.Decimal(checkout.total_price)
			: null,
		shopifyCreatedAt: checkout.created_at
			? new Date(checkout.created_at)
			: null,
		shopifyCustomerId: checkout.customer?.admin_graphql_api_id
			? String(checkout.customer.admin_graphql_api_id)
			: null,
		shopifyIntegrationId, // ID de integración con Shopify

		// Parsing de lineItems
		ShopifyLineItem:
			checkout.line_items?.map((lineItem) => ({
				lineItemId: lineItem.key
					? `gid://shopify/LineItem/${lineItem.key}`
					: null,
				shopifyProductId: lineItem.product_id
					? `gid://shopify/Product/${lineItem.product_id}`
					: null, // ID del producto asociado
				quantity: lineItem.quantity || 0, // Cantidad comprada
				price: lineItem.price
					? new Prisma.Decimal(lineItem.price)
					: new Prisma.Decimal(0), // Precio original por unidad
				originalUnitPrice: lineItem.price
					? new Prisma.Decimal(lineItem.price)
					: new Prisma.Decimal(0), // Precio unitario original
				discountedUnitPrice: lineItem.total_discount_set?.shop_money
					?.amount
					? new Prisma.Decimal(
							lineItem.total_discount_set.shop_money.amount,
						)
					: new Prisma.Decimal(0), // Precio unitario con descuento
				originalTotal: lineItem.line_price
					? new Prisma.Decimal(lineItem.line_price)
					: new Prisma.Decimal(0), // Total original
				discountedTotal: lineItem.total_discount_set?.shop_money?.amount
					? new Prisma.Decimal(
							lineItem.total_discount_set.shop_money.amount,
						)
					: new Prisma.Decimal(0),
				shopifyCheckoutId: checkout.id ? String(checkout.id) : null,
			})) || [],
	};
};

export { parseCheckout };
