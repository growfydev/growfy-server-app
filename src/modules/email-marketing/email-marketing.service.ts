import { Injectable } from '@nestjs/common';
import { Mailchimp } from './providers/mailchimp/mailchimp.provider';
import { Campaign } from './providers/mailchimp/interface/mailchimp.interface';
import {
	UpdateCampaignDto,
	UpdateCampaignRecipients,
} from './providers/mailchimp/dto/update-campaign.dto';

@Injectable()
export class EmailMarketingService {
	constructor(private readonly mailchimp: Mailchimp) {}

	getProvider(provider: number) {
		switch (provider) {
			case 1:
				return this.mailchimp;
			default:
				throw new Error('Proveedor no soportado');
		}
	}

	getLoginUrl(provider: number): string {
		return this.getProvider(provider).getOAuth2Url();
	}

	async getAccessToken(
		provider: number,
		code: string,
	): Promise<{ access_token: string; campaigns: Campaign[] }> {
		return this.getProvider(provider).getAccessToken(code);
	}

	async updateCampaignBasics(
		provider: number,
		campaignId: string,
		data: UpdateCampaignDto,
	): Promise<void> {
		return this.getProvider(provider).updateCampaignBasics(
			campaignId,
			data,
		);
	}

	async rescheduleCampaign(
		provider: number,
		campaignId: string,
		scheduleTime: string,
	): Promise<void> {
		return this.getProvider(provider).rescheduleCampaign(
			campaignId,
			scheduleTime,
		);
	}

	async updateCampaingRecipients(
		provider: number,
		campaignId: string,
		data: UpdateCampaignRecipients,
	): Promise<void> {
		return this.getProvider(provider).updateCampaingRecipients(
			campaignId,
			data,
		);
	}

	async cancelScheduledCampaign(
		provider: number,
		campaignId: string,
	): Promise<void> {
		return this.getProvider(provider).cancelScheduledCampaign(campaignId);
	}

	async duplicateCampaign(
		provider: number,
		campaignId: string,
	): Promise<void> {
		return this.getProvider(provider).duplicateCampaign(campaignId);
	}
}
