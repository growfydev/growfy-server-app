import { ShopifyOrder } from '../restapi/types';

export type ShopifyWebhookBody = ShopifyOrder | any;
