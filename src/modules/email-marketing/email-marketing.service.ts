import { Injectable } from '@nestjs/common';
import { Mailchimp } from './providers/mailchimp/mailchimp.provider';
import { Campaign } from './providers/mailchimp/interface/mailchimp.interface';

@Injectable()
export class EmailMarketingService {
	constructor(private readonly mailchimp: Mailchimp) {}

	getProvider(provider: string) {
		switch (provider) {
			case 'mailchimp':
				return this.mailchimp;
			default:
				throw new Error('Proveedor no soportado');
		}
	}

	getLoginUrl(provider: string): string {
		return this.getProvider(provider).getOAuth2Url();
	}

	async getAccessToken(
		provider: string,
		code: string,
	): Promise<{ access_token: string; campaigns: Campaign[] }> {
		return this.getProvider(provider).getAccessToken(code);
	}
}
