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
} from '@nestjs/common';
import { ShopifyAuthService } from './shopify.auth.service';
import { ShopifyDataService } from './shopify.data.service';
import { Auth } from '../auth/decorators/auth.decorator';
import { ProfileMemberRoles, Role } from '@prisma/client';
import { ResponseMessage } from 'src/decorators/responseMessage.decorator';

@Controller('shopify')
export class ShopifyController {
	constructor(
		private readonly shopifyAuthService: ShopifyAuthService,
		private readonly shopifyDataService: ShopifyDataService,
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
	@ResponseMessage('Access token received')
	async callback(@Query('shop') shop: string, @Query('code') code: string) {
		const accessToken = await this.shopifyAuthService.handleCallback(
			shop,
			code,
		);
		return { accessToken };
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

	/**
	 * Endpoint para recibir webhooks.
	 * Shopify enviará las notificaciones POST a este endpoint.
	 */
	@Post('webhooks')
	async handleWebhook(
		@Headers('X-Shopify-Hmac-SHA256') hmac: string,
		@Headers('X-Shopify-Topic') topic: string,
		@Headers('X-Shopify-Shop-Domain') shop: string,
		@Body() body: any,
	) {
		// **Validar la firma HMAC**
		const isValid = this.shopifyAuthService.verifyWebhookHmac(hmac, body);
		if (!isValid) {
			throw new BadRequestException('HMAC de Shopify inválido.');
		}

		if (topic === 'orders/create') {
			console.log(`Orden creada en la tienda ${shop}:`, body);
		}

		if (topic === 'orders/updated') {
			console.log(`Orden actualizada en la tienda ${shop}:`, body);
		}

		return { success: true };
	}
}
