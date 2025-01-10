import { Prisma } from '@prisma/client';
import { ShopifyOrderNode } from './types';

const GetOrdersData = (
	startDate: string,
	endDate: string,
	first: number = 50,
	after?: string,
): string => `
    query GetOrdersData {
        orders(
            first: ${first},
            after: ${after ? `"${after}"` : 'null'},
            query: "processed_at:>=${startDate} AND processed_at:<${endDate}T23:59:00"
        ) {
            pageInfo {
                hasNextPage
                endCursor
            }
            edges {
                node {
                    id
                    name
                    processedAt
                    displayFinancialStatus
                    totalPriceSet {
                        shopMoney {
                            amount
                            currencyCode
                        }
                    }
                    subtotalPriceSet {
                        shopMoney {
                            amount
                        }
                    }
                    customer {
                        id
                    }
                    billingAddress {
                        address1
                        latitude
                        longitude
                    }
                    shippingAddress {
                        address1
                        latitude
                        longitude
                    }
                    lineItems(first: 50) {
                        edges {
                            node {
                                id
                                quantity
                                product {
                                    id
                                }
                                originalUnitPriceSet {
                                    shopMoney {
                                        amount
                                    }
                                }
                                discountedUnitPriceSet {
                                    shopMoney {
                                        amount
                                    }
                                }
                                originalTotalSet {
                                    shopMoney {
                                        amount
                                    }
                                }
                                discountedTotalSet {
                                    shopMoney {
                                        amount
                                    }
                                }
                            }
                        }
                    }
                    currentTotalDiscountsSet {
                        shopMoney {
                            amount
                        }
                    }
                    currentTotalTaxSet {
                        shopMoney {
                            amount
                        }
                    }
                    paymentGatewayNames
                }
            }
        }
    }
`;

const parseOrders = (
	data: ShopifyOrderNode[],
	shopifyIntegrationId: number,
) => {
	return data.map((order) => ({
		orderId: order.id, // ID de la orden en Shopify
		orderNumber: order.name || null, // Nombre de la orden
		financialStatus: order.displayFinancialStatus || null, // Estado financiero
		currency: order.totalPriceSet?.shopMoney?.currencyCode || null, // Código de moneda
		subTotal: order.subtotalPriceSet?.shopMoney?.amount
			? new Prisma.Decimal(order.subtotalPriceSet.shopMoney.amount)
			: null, // Subtotal
		totalPrice: order.totalPriceSet?.shopMoney?.amount
			? new Prisma.Decimal(order.totalPriceSet.shopMoney.amount)
			: null, // Total de la orden
		shopifyCreatedAt: order.processedAt
			? new Date(order.processedAt)
			: null, // Fecha de creación
		paymentMethods: order.paymentGatewayNames || [], // Métodos de pago
		shippingAddress: order.shippingAddress?.address1 || null, // Dirección de envío
		shippingLat: order.shippingAddress?.latitude
			? new Prisma.Decimal(order.shippingAddress.latitude)
			: null, // Latitud de envío
		shippingLong: order.shippingAddress?.longitude
			? new Prisma.Decimal(order.shippingAddress.longitude)
			: null, // Longitud de envío
		trackingLink: order.shippingAddress?.trackingLink || null, // Enlace de seguimiento
		shopifyCustomerId: order.customer?.id || null, // ID del cliente de Shopify
		shopifyIntegrationId, // ID de integración
		hasDiscounts:
			order.currentTotalDiscountsSet?.shopMoney?.amount &&
			new Prisma.Decimal(
				order.currentTotalDiscountsSet.shopMoney.amount,
			).greaterThan(0), // Si tiene descuentos
		hasGiftCards:
			order.currentTotalTaxSet?.shopMoney?.amount &&
			new Prisma.Decimal(
				order.currentTotalTaxSet.shopMoney.amount,
			).greaterThan(0), // Si tiene tarjetas de regalo

		// Parsing lineItems
		ShopifyLineItem: order.lineItems.edges.map((lineItem) => ({
			lineItemId: lineItem.node.id, // ID del line item
			shopifyProductId: lineItem.node.product?.id || null, // ID del producto asociado
			quantity: lineItem.node.quantity || 0, // Cantidad del producto
			price: lineItem.node.originalUnitPriceSet?.shopMoney?.amount
				? new Prisma.Decimal(
						lineItem.node.originalUnitPriceSet.shopMoney.amount,
					)
				: new Prisma.Decimal(0), // Precio original por unidad
			originalUnitPrice: lineItem.node.originalUnitPriceSet?.shopMoney
				?.amount
				? new Prisma.Decimal(
						lineItem.node.originalUnitPriceSet.shopMoney.amount,
					)
				: new Prisma.Decimal(0), // Precio original por unidad
			discountedUnitPrice: lineItem.node.discountedUnitPriceSet?.shopMoney
				?.amount
				? new Prisma.Decimal(
						lineItem.node.discountedUnitPriceSet.shopMoney.amount,
					)
				: new Prisma.Decimal(0), // Precio con descuento por unidad
			originalTotal: lineItem.node.originalTotalSet?.shopMoney?.amount
				? new Prisma.Decimal(
						lineItem.node.originalTotalSet.shopMoney.amount,
					)
				: new Prisma.Decimal(0), // Total original
			discountedTotal: lineItem.node.discountedTotalSet?.shopMoney?.amount
				? new Prisma.Decimal(
						lineItem.node.discountedTotalSet.shopMoney.amount,
					)
				: new Prisma.Decimal(0), // Total con descuento
			shopifyOrderId: order.id, // Asociación con la orden padre
		})),
	}));
};

export { GetOrdersData, parseOrders };
