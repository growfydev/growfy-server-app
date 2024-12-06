import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class TiktokService {
	private readonly clientKey = process.env.TIKTOK_CLIENT_KEY;
	private readonly clientSecret = process.env.TIKTOK_CLIENT_SECRET;
	private readonly redirectUri = process.env.TIKTOK_REDIRECT_URI;

	async getAccessToken(authCode: string): Promise<string> {
		const url = 'https://open-api.tiktok.com/oauth/access_token/';
		const params = {
			client_key: this.clientKey,
			client_secret: this.clientSecret,
			code: authCode,
			grant_type: 'authorization_code',
			redirect_uri: this.redirectUri,
		};

		try {
			const response = await axios.post(url, params);
			const { data } = response;

			if (data?.data?.access_token) {
				return data.data.access_token;
			} else {
				throw new HttpException(
					'Error al obtener el token de acceso',
					HttpStatus.BAD_REQUEST,
				);
			}
		} catch (error) {
			throw new HttpException(
				`Error al conectar con TikTok: ${error.message}`,
				HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}
}
