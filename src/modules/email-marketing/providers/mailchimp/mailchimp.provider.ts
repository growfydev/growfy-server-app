import { Injectable } from '@nestjs/common';
import MailchimpClient from '@mailchimp/mailchimp_marketing';
import axios from 'axios';
import { Campaign } from './interface/mailchimp.interface';
import {
	UpdateCampaignDto,
	UpdateCampaignRecipients,
} from './dto/update-campaign.dto';

@Injectable()
export class Mailchimp {
	private clientId = process.env.MAILCHIMP_CLIENT_ID;
	private clientSecret = process.env.MAILCHIMP_CLIENT_SECRET;
	private redirectUri = process.env.MAILCHIMP_REDIRECT_URI;
	private url = process.env.MAILCHIMP_URL_BASE;

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
			state: JSON.stringify({ providerId: 1 }),
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

		if ('campaigns' in response) {
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

	// Datos Básicos de la Campaña. Método para actualizar información básica de la campaña
	async updateCampaignBasics(
		campaign_id: string,
		data: UpdateCampaignDto,
	): Promise<void> {
		const body = {
			settings: {
				title: data.title,
				subject_line: data.subjectLine,
				preview_text: data.previewText,
			},
		};

		const response = await axios.patch(
			this.url + `/campaigns/${campaign_id}`,
			body,
			{
				auth: {
					username: 'anystring',
					password: process.env.MAILCHIMP_API_KEY,
				},
			},
		);

		return response.data;
	}

	// Fecha y Hora. Método para reprogramar una campaña
	async rescheduleCampaign(
		campaign_id: string,
		scheduleTime: string,
	): Promise<void> {
		const unschedulerurl =
			this.url + `/campaigns/${campaign_id}/actions/unschedule`;
		const schedulerurl =
			this.url + `/campaigns/${campaign_id}/actions/schedule`;
		const data = {
			schedule_time: scheduleTime, // Formato ISO 8601, por ejemplo: '2024-12-06T19:22:39.829Z'
		};

		// Cancelamos la programación actual
		await axios.post(unschedulerurl, null, {
			auth: {
				username: 'anystring',
				password: process.env.MAILCHIMP_API_KEY,
			},
		});

		// Programamos la campaña en la nueva fecha
		const response = await axios.post(schedulerurl, data, {
			auth: {
				username: 'anystring',
				password: process.env.MAILCHIMP_API_KEY,
			},
		});

		return response.data;
	}

	// Segmentación. Método para actualizar los destinatarios de una campaña
	async updateCampaingRecipients(
		campaign_id: string,
		data: UpdateCampaignRecipients,
	): Promise<void> {
		const response = await axios.patch(
			this.url + `/campaigns/${campaign_id}/recipients`,
			data,
			{
				auth: {
					username: 'anystring',
					password: process.env.MAILCHIMP_API_KEY,
				},
			},
		);

		return response.data;
	}

	// Estado del Correo. Método para ancelar una campaña programada
	async cancelScheduledCampaign(campaign_id: string): Promise<void> {
		const response = await axios.post(
			this.url + `/campaigns/${campaign_id}/actions/cancel-send`,
			null,
			{
				auth: {
					username: 'anystring',
					password: process.env.MAILCHIMP_API_KEY,
				},
			},
		);

		return response.data;
	}

	// Estado del Correo. Método para dupliar una campaña
	async duplicateCampaign(campaign_id: string): Promise<void> {
		const response = await axios.post(
			this.url + `/campaigns/${campaign_id}/actions/replicate`,
			null,
			{
				auth: {
					username: 'anystring',
					password: process.env.MAILCHIMP_API_KEY,
				},
			},
		);

		return response.data;
	}
}
