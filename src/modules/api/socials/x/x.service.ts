import { Injectable, HttpException } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class XService {
  private readonly apiKey = process.env.X_API_KEY;
  private readonly apiSecretKey = process.env.X_API_SECRET_KEY;
  private readonly redirectUri = process.env.X_REDIRECT_URI;
  private readonly apiUrl = 'https://api.twitter.com/2';

  /**
   * Generar la URL de Autorización
   */
  getAuthorizationUrl(): string {
    const scope = encodeURIComponent(process.env.X_SCOPE);
    return `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${this.apiKey}&redirect_uri=${encodeURIComponent(this.redirectUri)}&scope=${scope}&state=random_state&code_challenge=challenge&code_challenge_method=plain`;
  }

  /**
   * Intercambiar el Código de Autorización por un Access Token
   */
  async getAccessToken(code: string): Promise<string> {
    const url = 'https://api.twitter.com/2/oauth2/token';
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };
    const body = new URLSearchParams({
      client_id: this.apiKey,
      client_secret: this.apiSecretKey,
      code,
      grant_type: 'authorization_code',
      redirect_uri: this.redirectUri,
      code_verifier: 'challenge',
    });

    try {
      const response = await axios.post(url, body.toString(), { headers });
      return response.data.access_token;
    } catch (error) {
      const status = error.response?.status || 500;
      const errorData = error.response?.data || error.message;
      throw new HttpException(`Error al obtener el Access Token: ${JSON.stringify(errorData)}`, status);
    }
  }

  /**
   * Publicar un Tweet
   */
  async postTweet(text: string, accessToken: string): Promise<any> {
    const url = `${this.apiUrl}/tweets`;
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };
    const body = { text };

    try {
      const response = await axios.post(url, body, { headers });
      return response.data;
    } catch (error) {
      const status = error.response?.status || 500;
      const errorData = error.response?.data || error.message;
      throw new HttpException(`Error al publicar el tweet: ${JSON.stringify(errorData)}`, status);
    }
  }
}
