import {
	Controller,
	Get,
	Query,
	Res,
	HttpStatus,
	HttpException,
	Patch,
	Body,
	Param,
	Post,
} from '@nestjs/common';
import { EmailMarketingService } from './email-marketing.service';
import { Response } from 'express';
import { Auth } from '../auth/decorators/auth.decorator';
import { Role } from '@prisma/client';
import {
	UpdateCampaignDto,
	UpdateCampaignRecipients,
} from './providers/mailchimp/dto/update-campaign.dto';

@Controller('email-marketing')
export class EmailMarketingController {
	/**
	 *
	 * @param providerId
	 * 1: Mailchimp
	 * 2: Klaviyo
	 * 3: ActiveCampaign
	 */

	constructor(
		private readonly emailMarketingService: EmailMarketingService,
	) {}

	@Get('login-url')
	@Auth([Role.USER])
	async getLoginUrl(
		@Query('providerId') providerId: number,
	): Promise<string> {
		return this.emailMarketingService.getLoginUrl(+providerId);
	}

	@Get('login-url/callback')
	@Auth([Role.USER])
	async oauth2Callback(
		@Query('code') code: string,
		@Query('state') state: string,
		@Res() res: Response,
	): Promise<void> {
		if (!code) {
			throw new HttpException(
				'Missing code parameter',
				HttpStatus.BAD_REQUEST,
			);
		}
		let providerId = '';
		try {
			if (state) {
				const parsedState = JSON.parse(state);
				providerId = parsedState.provider;
			}
			const accessToken = await this.emailMarketingService.getAccessToken(
				+providerId,
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

	@Patch('campaigns/:providerId/:campaignId')
	@Auth([Role.USER])
	async updateCampaignBasics(
		@Param('providerId') providerId: number,
		@Param('campaignId') campaignId: string,
		@Body() data: UpdateCampaignDto,
	): Promise<void> {
		return this.emailMarketingService.updateCampaignBasics(
			+providerId,
			campaignId,
			data,
		);
	}

	@Post('capaigns/reschedule/:providerId/:campaignId')
	@Auth([Role.USER])
	async rescheduleCampaign(
		@Param('providerId') providerId: number,
		@Param('campaignId') campaignId: string,
		@Body('scheduleTime') scheduleTime: string,
	): Promise<void> {
		return this.emailMarketingService.rescheduleCampaign(
			+providerId,
			campaignId,
			scheduleTime,
		);
	}

	@Patch('campaigns/recipients/:providerId/:campaignId')
	@Auth([Role.USER])
	async updateCampaingRecipients(
		@Param('providerId') providerId: number,
		@Param('campaignId') campaignId: string,
		@Body() data: UpdateCampaignRecipients,
	): Promise<void> {
		return this.emailMarketingService.updateCampaingRecipients(
			+providerId,
			campaignId,
			data,
		);
	}

	@Post('campaigns/cancel-scheduled/:providerId/:campaignId')
	@Auth([Role.USER])
	async cancelScheduledCampaign(
		@Param('providerId') providerId: number,
		@Param('campaignId') campaignId: string,
	): Promise<void> {
		return this.emailMarketingService.cancelScheduledCampaign(
			+providerId,
			campaignId,
		);
	}

	@Post('campaigns/duplicate/:providerId/:campaignId')
	@Auth([Role.USER])
	async duplicateCampaign(
		@Param('providerId') providerId: number,
		@Param('campaignId') campaignId: string,
	): Promise<void> {
		return this.emailMarketingService.duplicateCampaign(
			+providerId,
			campaignId,
		);
	}
}
