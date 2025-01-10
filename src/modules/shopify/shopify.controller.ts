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
	async getShopInfo(@Param('profileId', ParseIntPipe) profileId: number) {
		const shop = await this.shopifyDataService.getShopInfo(profileId);
		return { shop };
	}

	@Get(':profileId/orders')
	@ResponseMessage('Orders data')
	@Auth([Role.USER], [ProfileMemberRoles.OWNER])
	async getOrdersData(
		@Param('profileId', ParseIntPipe) profileId: number,
		@Query('startDate') startDate: string,
		@Query('endDate') endDate: string,
	) {
		const ordersData = await this.shopifyDataService.getShopOrdersData(
			profileId,
			startDate,
			endDate,
		);
		return ordersData;
	}

	/**
	 * Endpoint para recibir webhooks.
	 * Shopify enviará las notificaciones POST a este endpoint.
	 */
	@Post('webhook')
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
