export const WebhookTopics = {
	ORDERS_CREATE: 'orders/create',
	ORDERS_UPDATED: 'orders/updated',
	ORDERS_DELETE: 'orders/delete',

	CUSTOMERS_CREATE: 'customers/create',
	CUSTOMERS_UPDATE: 'customers/update',
	CUSTOMERS_DELETE: 'customers/delete',

	PRODUCTS_CREATE: 'products/create',
	PRODUCTS_UPDATE: 'products/update',
	PRODUCTS_DELETE: 'products/delete',
} as const;

export type WebhookTopic = (typeof WebhookTopics)[keyof typeof WebhookTopics];
