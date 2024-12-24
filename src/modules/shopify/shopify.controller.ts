import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ShopifyService } from './shopify.service';
import { Auth } from '../auth/decorators/auth.decorator';
import { ProfileMemberRoles, Role } from '@prisma/client';
import { ResponseMessage } from 'src/decorators/responseMessage.decorator';

@Controller('shopify')
export class ShopifyController {
	constructor(private readonly shopifyService: ShopifyService) {}

	@Get(':profileId/auth/:shop')
	@ResponseMessage('Redirect to Shopify')
	@Auth([Role.USER], [ProfileMemberRoles.OWNER])
	async auth(
		@Param('profileId', ParseIntPipe) profileId: number,
		@Param('shop') shop: string,
	) {
		const url = await this.shopifyService.getAuthUrl(profileId, shop);
		return { url };
	}

	@Get('oauth2callback')
	@ResponseMessage('Access token received')
	async callback(@Query('shop') shop: string, @Query('code') code: string) {
		const accessToken = await this.shopifyService.handleCallback(
			shop,
			code,
		);
		return { accessToken };
	}
}
