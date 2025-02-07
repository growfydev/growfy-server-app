import { Injectable } from '@nestjs/common';
import MailchimpClient from '@mailchimp/mailchimp_marketing';
import axios from 'axios';
import { Campaign } from './interface/mailchimp.interface';

@Injectable()
export class Mailchimp {
	private clientId = process.env.MAILCHIMP_CLIENT_ID;
	private clientSecret = process.env.MAILCHIMP_CLIENT_SECRET;
	private redirectUri = process.env.MAILCHIMP_REDIRECT_URI;

	constructor() {
		MailchimpClient.setConfig({
			accessToken: process.env.MAILCHIMP_API_KEY,
			server: process.env.MAILCHIMP_SERVER_PREFIX,
		});
	}

	getOAuth2Url(): string {
		const params = new URLSearchParams({
			response_type: 'code',
			client_id: this.clientId,
			redirect_uri: this.redirectUri,
			state: JSON.stringify({ provider: 'mailchimp' }),
		});

		return `https://login.mailchimp.com/oauth2/authorize?${params.toString()}`;
	}

	async getAccessToken(
		code: string,
	): Promise<{ access_token: string; campaigns: Campaign[] }> {
		const params = new URLSearchParams({
			grant_type: 'authorization_code',
			client_id: this.clientId,
			client_secret: this.clientSecret,
			redirect_uri: this.redirectUri,
			code,
		});

		const tokenResponse = await axios.post(
			'https://login.mailchimp.com/oauth2/token',
			params.toString(),
			{
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
			},
		);

		const { access_token } = tokenResponse.data;
		console.log(access_token);

		// Llamar al método para sincronizar campañas
		const campaigns = await this.syncCampaigns(access_token);

		return { access_token, campaigns };
	}

	async syncCampaigns(accessToken: string): Promise<Campaign[]> {
		MailchimpClient.setConfig({
			accessToken,
			server: 'us15',
		});

		const response = await MailchimpClient.campaigns.list({
			sinceCreateTime: new Date(
				new Date().setMonth(new Date().getMonth() - 1),
			).toISOString(),
		});

		if ('campaigns' in response && Array.isArray(response.campaigns)) {
			const campaigns = response.campaigns.map((campaign: Campaign) => ({
				...campaign,
				settings: {
					title: campaign.settings.title,
					subject_line: campaign.settings.subject_line,
				},
				report_summary: {
					open_rate: campaign.report_summary.open_rate,
					click_rate: campaign.report_summary.click_rate,
					bounce_rate: campaign.report_summary.bounce_rate,
				},
			}));

			return campaigns;
		} else {
			console.error('Error fetching campaigns:', response);
			return [];
		}
	}
}
