import {
	ShopifyCheckout,
	ShopifyCustomer,
	ShopifyOrder,
	ShopifyOrderDelete,
	ShopifyProduct,
	ShopifyProductDelete,
} from '../restapi/types';

export type ShopifyWebhookBody =
	| ShopifyOrder
	| ShopifyCustomer
	| ShopifyProduct
	| ShopifyCheckout
	| ShopifyOrderDelete
	| ShopifyProductDelete
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	| any;
