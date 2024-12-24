import { Controller, Get, Query, Redirect } from '@nestjs/common';
import { ShopifyService } from './shopify.service';

@Controller('shopify')
export class ShopifyController {
	constructor(private readonly shopifyService: ShopifyService) {}

	@Get('login')
	@Redirect()
	login(@Query('shop') shop: string) {
		const url = this.shopifyService.getAuthUrl(shop);
		return { url };
	}

	@Get('oauth2callback')
	async callback(@Query('shop') shop: string, @Query('code') code: string) {
		const accessToken = await this.shopifyService.getAccessToken(
			shop,
			code,
		);
		// Aquí puedes guardar el accessToken y realizar acciones adicionales.
		console.log(accessToken);

		return { message: 'Autenticación exitosa', accessToken };
	}
}
