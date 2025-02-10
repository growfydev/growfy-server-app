import {
	Controller,
	Get,
	Query,
	Res,
	HttpStatus,
	HttpException,
} from '@nestjs/common';
import { EmailMarketingService } from './email-marketing.service';
import { Response } from 'express';
import { Auth } from '../auth/decorators/auth.decorator';
import { Role } from '@prisma/client';

@Controller('email-marketing')
export class EmailMarketingController {
	constructor(
		private readonly emailMarketingService: EmailMarketingService,
	) {}

	@Get('login-url')
	@Auth([Role.USER])
	async getLoginUrl(@Query('provider') provider: string) {
		return this.emailMarketingService.getLoginUrl(provider);
	}

	@Get('login-url/callback')
	@Auth([Role.USER])
	async oauth2Callback(
		@Query('code') code: string,
		@Query('state') state: string,
		@Res() res: Response,
	) {
		if (!code) {
			throw new HttpException(
				'Missing code parameter',
				HttpStatus.BAD_REQUEST,
			);
		}
		let provider = '';
		try {
			if (state) {
				const parsedState = JSON.parse(state);
				provider = parsedState.provider;
			}
			const accessToken = await this.emailMarketingService.getAccessToken(
				provider,
				code,
			);
			res.status(HttpStatus.OK).json({
				message: 'Authentication successful!',
				accessToken,
			});
		} catch (error) {
			throw new HttpException(
				`Authentication failed: ${error.message}`,
				HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}
}
