import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ShopifyService } from './shopify.service';
import { Auth } from '../auth/decorators/auth.decorator';
import { ProfileMemberRoles, Role } from '@prisma/client';

@Controller('shopify')
export class ShopifyController {
	constructor(private readonly shopifyService: ShopifyService) {}

	@Get(':profileId/auth/:shop')
	@Auth([Role.USER], [ProfileMemberRoles.OWNER])
	auth(
		@Param('profileId', ParseIntPipe) profileId: number,
		@Param('shop') shop: string,
	) {
		const url = this.shopifyService.getAuthUrl(profileId, shop);
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
