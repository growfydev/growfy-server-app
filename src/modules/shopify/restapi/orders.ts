import { Prisma } from '@prisma/client';
import { ShopifyOrder } from './types';

const parseOrder = (order: ShopifyOrder, shopifyIntegrationId: number) => {
	return {
		orderId: order.admin_graphql_api_id || null, // ID de la orden en Shopify
		orderNumber: order.name || null, // Número o nombre de la orden
		financialStatus: order.financial_status?.toUpperCase() || null, // Estado financiero de la orden
		currency: order.currency || null, // Código de moneda utilizado
		subTotal: order.current_subtotal_price_set?.shop_money?.amount
			? new Prisma.Decimal(
					order.current_subtotal_price_set.shop_money.amount,
				)
			: null, // Subtotal de la orden
		totalPrice: order.current_total_price_set?.shop_money?.amount
			? new Prisma.Decimal(
					order.current_total_price_set.shop_money.amount,
				)
			: null, // Precio total de la orden
		shopifyCreatedAt: order.processed_at
			? new Date(order.processed_at)
			: null, // Fecha de creación de la orden
		paymentMethods: order.payment_gateway_names || [], // Métodos de pago utilizados
		shippingAddress: order.shipping_address?.address1 || null, // Dirección principal de envío
		shippingLat: order.shipping_address?.latitude
			? new Prisma.Decimal(order.shipping_address.latitude)
			: null, // Latitud de la dirección de envío
		shippingLong: order.shipping_address?.longitude
			? new Prisma.Decimal(order.shipping_address.longitude)
			: null, // Longitud de la dirección de envío
		statusPageUrl: order.order_status_url || null, // URL de estado de la orden
		shopifyCustomerId: order.customer?.admin_graphql_api_id || null, // ID del cliente asociado en Shopify
		shopifyIntegrationId, // ID de integración con Shopify
		hasDiscounts: order.current_total_discounts_set?.shop_money?.amount
			? new Prisma.Decimal(
					order.current_total_discounts_set.shop_money.amount,
				).greaterThan(0)
			: false, // Indicador de descuentos aplicados
		hasGiftCards: order.current_total_tax_set?.shop_money?.amount
			? new Prisma.Decimal(
					order.current_total_tax_set.shop_money.amount,
				).greaterThan(0)
			: false, // Indicador de tarjetas de regalo aplicadas

		shopifyCheckoutId: order.checkout_id ? String(order.checkout_id) : null,
		// Parsing de lineItems
		ShopifyLineItem:
			order.line_items?.map((lineItem) => ({
				lineItemId: lineItem.admin_graphql_api_id || null, // ID del line item en Shopify
				shopifyProductId: lineItem.product_id
					? `gid://shopify/Product/${lineItem.product_id}`
					: null, // ID del producto asociado
				quantity: lineItem.quantity || 0, // Cantidad comprada
				price: lineItem.price_set?.shop_money?.amount
					? new Prisma.Decimal(lineItem.price_set.shop_money.amount)
					: new Prisma.Decimal(0), // Precio original por unidad
				originalUnitPrice: lineItem.price_set?.shop_money?.amount
					? new Prisma.Decimal(lineItem.price_set.shop_money.amount)
					: new Prisma.Decimal(0), // Precio unitario original
				discountedUnitPrice: lineItem.total_discount_set?.shop_money
					?.amount
					? new Prisma.Decimal(
							lineItem.total_discount_set.shop_money.amount,
						)
					: new Prisma.Decimal(0), // Precio unitario con descuento
				originalTotal: lineItem.price
					? new Prisma.Decimal(lineItem.price)
					: new Prisma.Decimal(0), // Total original
				discountedTotal: lineItem.total_discount_set?.shop_money?.amount
					? new Prisma.Decimal(
							lineItem.total_discount_set.shop_money.amount,
						)
					: new Prisma.Decimal(0), // Total con descuentos
				shopifyOrderId: order.admin_graphql_api_id || null, // ID de la orden en Shopify
			})) || [], // Lista de line items o un array vacío
	};
};

export { parseOrder };
