export const WebhookTopics = {
	ORDERS_CREATE: 'orders/create',
	ORDERS_UPDATE: 'orders/updated',
	ORDERS_DELETE: 'orders/delete',

	CUSTOMERS_CREATE: 'customers/create',
	CUSTOMERS_UPDATE: 'customers/update',
	CUSTOMERS_DELETE: 'customers/delete',

	PRODUCTS_CREATE: 'products/create',
	PRODUCTS_UPDATE: 'products/update',
	PRODUCTS_DELETE: 'products/delete',

	CHECKOUTS_CREATE: 'checkouts/create',
	CHECKOUTS_UPDATE: 'checkouts/update',
} as const;

export type WebhookTopic = (typeof WebhookTopics)[keyof typeof WebhookTopics];
