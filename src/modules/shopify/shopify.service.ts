import { Injectable } from '@nestjs/common';
import configLoader from '../../lib/ConfigLoader';
import axios from 'axios';

@Injectable()
export class ShopifyService {
	private readonly clientId = configLoader().shopify.clientId;
	private readonly clientSecret = configLoader().shopify.clientSecret;
	private readonly redirectUri = configLoader().shopify.redirectUri;
	private readonly scopes = configLoader().shopify.scopes;

	getAuthUrl(shop: string): string {
		return `https://${shop}/admin/oauth/authorize?client_id=${this.clientId}&scope=${this.scopes}&redirect_uri=${this.redirectUri}`;
	}

	async getAccessToken(shop: string, code: string): Promise<string> {
		const response = await axios.post(
			`https://${shop}/admin/oauth/access_token`,
			{
				client_id: this.clientId,
				client_secret: this.clientSecret,
				code,
			},
		);
		return response.data.access_token;
	}
}
