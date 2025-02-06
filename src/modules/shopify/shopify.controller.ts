import {
	BadRequestException,
	Body,
	Controller,
	Get,
	Headers,
	Param,
	ParseIntPipe,
	Post,
	Query,
	Res,
} from '@nestjs/common';
import { ShopifyAuthService } from './services/shopify.auth.service';
import { ShopifyDataService } from './services/shopify.data.service';
import { Auth } from '../auth/decorators/auth.decorator';
import { ProfileMemberRoles, Role } from '@prisma/client';
import { ResponseMessage } from 'src/decorators/responseMessage.decorator';
import { ShopifyCronService } from './services/shopify.cron.service';
import { ShopifyWebhookService } from './services/shopify.webhooks.service';
import { Response } from 'express';
import configLoader from 'src/lib/ConfigLoader';
import {
	ShopifyCheckout,
	ShopifyCustomer,
	ShopifyOrder,
	ShopifyOrderDelete,
	ShopifyProduct,
	ShopifyProductDelete,
} from './restapi/types';
import { ShopifyWebhookBody } from './common/types';
import { WebhookTopics } from './common/webhook-topics';

@Controller('shopify')
export class ShopifyController {
	constructor(
		private readonly shopifyAuthService: ShopifyAuthService,
		private readonly shopifyDataService: ShopifyDataService,
		private readonly shopifyCronService: ShopifyCronService,
		private readonly shopifyWebhookService: ShopifyWebhookService,
	) {}

	@Get(':profileId/auth/:shop')
	@ResponseMessage('Redirect to Shopify')
	@Auth([Role.USER], [ProfileMemberRoles.OWNER])
	async auth(
		@Param('profileId', ParseIntPipe) profileId: number,
		@Param('shop') shop: string,
	) {
		const url = await this.shopifyAuthService.getAuthUrl(profileId, shop);
		return { url };
	}

	@Get('oauth2callback')
	@ResponseMessage('Redirecting to frontend')
	async callback(
		@Query('shop') shop: string,
		@Query('code') code: string,
		@Res() res: Response,
	) {
		await this.shopifyAuthService.handleCallback(shop, code);
		const redirectUrl = `${configLoader().client_url}/dashboard/shopify`;
		return res.redirect(redirectUrl);
	}

	@Get(':profileId/shop')
	@ResponseMessage('Shop info')
	@Auth([Role.USER], [ProfileMemberRoles.OWNER])
	async getShop(@Param('profileId', ParseIntPipe) profileId: number) {
		const shop = await this.shopifyDataService.getShop(profileId);
		return { shop };
	}

	@Get(':profileId/customers')
	@ResponseMessage('Customers data')
	@Auth([Role.USER], [ProfileMemberRoles.OWNER])
	async getCustomersData(
		@Param('profileId', ParseIntPipe) profileId: number,
	) {
		const customers = await this.shopifyDataService.getCustomers(profileId);
		return customers;
	}

	@Get(':profileId/newVsReturningCustomer')
	@ResponseMessage('New vs Returning Customer data')
	@Auth([Role.USER], [ProfileMemberRoles.OWNER])
	async getNewVsReturningCustomer(
		@Param('profileId', ParseIntPipe) profileId: number,
		@Query('startDate') startDate: string,
		@Query('endDate') endDate: string,
	) {
		const data = this.shopifyDataService.getNewVsReturningCustomer(
			profileId,
			startDate,
			endDate,
		);

		return data;
	}

	@Get(':profileId/products')
	@ResponseMessage('Products data')
	@Auth([Role.USER], [ProfileMemberRoles.OWNER])
	async getProductsData(@Param('profileId', ParseIntPipe) profileId: number) {
		const products = await this.shopifyDataService.getProducts(profileId);
		return products;
	}

	@Get(':profileId/lowInventory')
	@ResponseMessage('Low inventory products data')
	@Auth([Role.USER], [ProfileMemberRoles.OWNER])
	async getLowInventoryProducts(
		@Param('profileId', ParseIntPipe) profileId: number,
	) {
		const products =
			await this.shopifyDataService.getLowInventory(profileId);
		return products;
	}

	@Get(':profileId/orders')
	@ResponseMessage('Orders data')
	@Auth([Role.USER], [ProfileMemberRoles.OWNER])
	async getOrdersData(
		@Param('profileId', ParseIntPipe) profileId: number,
		@Query('startDate') startDate: string,
		@Query('endDate') endDate: string,
	) {
		const orders = await this.shopifyDataService.getOrders(
			profileId,
			startDate,
			endDate,
		);
		return orders;
	}

	@Get(':profileId/dailySummaries')
	@ResponseMessage('Daily Summaries data')
	@Auth([Role.USER], [ProfileMemberRoles.OWNER])
	async getDailySummaries(
		@Param('profileId', ParseIntPipe) profileId: number,
		@Query('month') month: string,
		@Query('year') year: string,
	) {
		const summaries = await this.shopifyCronService.getDailySummaries(
			profileId,
			month,
			year,
		);
		return { summaries };
	}

	/**
	 * Endpoint para recibir webhooks.
	 * Shopify enviará las notificaciones POST a este endpoint.
	 */
	@Post('webhooks')
	async handleWebhook(
		@Headers('X-Shopify-Hmac-SHA256') hmac: string,
		@Headers('X-Shopify-Topic') topic: string,
		@Headers('X-Shopify-Shop-Domain') shop: string,
		@Body() body: ShopifyWebhookBody,
	) {
		// **Validar la firma HMAC**
		const isValid = this.shopifyAuthService.verifyWebhookHmac(hmac, body);
		if (!isValid) {
			throw new BadRequestException('HMAC de Shopify inválido.');
		}

		switch (topic) {
			case WebhookTopics.CUSTOMERS_CREATE:
			case WebhookTopics.CUSTOMERS_UPDATE:
				this.shopifyWebhookService.customerCreateOrUpdate(
					shop,
					body as ShopifyCustomer,
				);
				break;
			case WebhookTopics.CUSTOMERS_DELETE:
				this.shopifyWebhookService.customerDelete(
					shop,
					body as ShopifyCustomer,
				);
			case WebhookTopics.PRODUCTS_CREATE:
			case WebhookTopics.PRODUCTS_UPDATE:
				this.shopifyWebhookService.productCreateOrUpdate(
					shop,
					body as ShopifyProduct,
				);
				break;
			case WebhookTopics.PRODUCTS_DELETE:
				this.shopifyWebhookService.productDelete(
					shop,
					body as ShopifyProductDelete,
				);
				break;
			case WebhookTopics.ORDERS_CREATE:
			case WebhookTopics.ORDERS_UPDATE:
				this.shopifyWebhookService.orderCreateOrUpdate(
					shop,
					body as ShopifyOrder,
				);
				break;
			case WebhookTopics.ORDERS_DELETE:
				this.shopifyWebhookService.ordersDelete(
					shop,
					body as ShopifyOrderDelete,
				);
				break;
			case WebhookTopics.CHECKOUTS_CREATE:
			case WebhookTopics.CHECKOUTS_UPDATE:
				this.shopifyWebhookService.checkoutCreateOrUpdate(
					shop,
					body as ShopifyCheckout,
				);
				break;
			default:
				throw new BadRequestException('Webhook topic no soportado.');
		}

		return { success: true };
	}
}
