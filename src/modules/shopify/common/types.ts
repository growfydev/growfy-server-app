import {
	ShopifyCustomer,
	ShopifyOrder,
	ShopifyProduct,
} from '../restapi/types';

export type ShopifyWebhookBody =
	| ShopifyOrder
	| ShopifyCustomer
	| ShopifyProduct
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	| any;
