import { JsonValue } from '@prisma/client/runtime/library';
import axios from 'axios';
import { PostData } from 'src/types/types';
import { PostPublisher } from '../common/post-factory/post.publisher.interface';
import { google } from 'googleapis';
import configLoader from 'src/lib/ConfigLoader';
import { OAuth2Client } from 'google-auth-library';

export interface YouTubeVideo {
	id: string;
	title: string;
	description: string;
	thumbnailUrl: string;
	publishedAt: Date;
}

// youtube.config.ts
export interface YouTubeConfig {
	apiKey: string;
	clientId: string;
	clientSecret: string;
	redirectUri: string;
}
export class YouTubePublisher implements PostPublisher {
	private oauth2Client: OAuth2Client;

	constructor() {
		const config: YouTubeConfig = {
			apiKey: configLoader().google.youtube.apiKey,
			clientId: configLoader().google.youtube.clientId,
			clientSecret: configLoader().google.youtube.clientSecret,
			redirectUri: configLoader().google.youtube.redirectUri,
		};

		this.oauth2Client = new OAuth2Client(
			config.clientId,
			config.clientSecret,
			config.redirectUri,
		);

		this.youtube = google.youtube({
			version: 'v3',
			auth: this.oauth2Client,
		});
	}

	private readonly youtube = google.youtube('v3');

	async publish(
		typePostName: string,
		fields: JsonValue,
		data: PostData,
	): Promise<void> {
		if (!fields) {
			throw new Error(
				'El campo "fields" es requerido en los datos de entrada.',
			);
		}

		switch (typePostName) {
			case 'video':
				await this.createVideoPost(data.accountId, data.token, fields);
				break;
			case 'short_video':
				await this.createShortPost(data.accountId, data.token, fields);
				break;
			default:
				throw new Error('No se encontró el tipo de post');
		}
	}

	private async createVideoPost(
		accountId: string,
		token: string,
		fields: JsonValue,
	): Promise<void> {
		if (
			typeof fields !== 'object' ||
			!fields ||
			!('title' in fields) ||
			!('description' in fields) ||
			!('fileUrl' in fields)
		) {
			throw new Error(
				'Los campos "title", "description" y "fileUrl" son requeridos en los datos de entrada.',
			);
		}

		try {
			// Descargar el archivo de video
			const videoResponse = await axios.get(fields.fileUrl as string, {
				responseType: 'arraybuffer',
			});
			const videoBuffer = Buffer.from(videoResponse.data);

			// Configurar el cliente de YouTube
			const oauth2Client = new google.auth.OAuth2();
			oauth2Client.setCredentials({ access_token: token });

			// Crear la solicitud de subida
			await this.youtube.videos.insert({
				auth: oauth2Client,
				part: ['snippet', 'status'],
				requestBody: {
					snippet: {
						title: fields.title as string,
						description: fields.description as string,
						categoryId: '22', // Categoría "People & Blogs"
					},
					status: {
						privacyStatus: 'public',
					},
				},
				media: {
					body: videoBuffer,
				},
			});
		} catch (error) {
			let errorMessage = 'Error en la publicación del video';
			if (axios.isAxiosError(error)) {
				errorMessage =
					error.response?.data?.error?.message || error.message;
			} else if (error instanceof Error) {
				errorMessage = error.message;
			}
			throw new Error(
				`Error al realizar la publicación: ${errorMessage}`,
			);
		}
	}

	private async getAuthUrl(): Promise<string> {
		const scopes = [
			'https://www.googleapis.com/auth/youtube.readonly',
			'https://www.googleapis.com/auth/youtube.upload',
		];

		return this.oauth2Client.generateAuthUrl({
			access_type: 'offline',
			scope: scopes,
		});
	}

	private async createShortPost(
		accountId: string,
		token: string,
		fields: JsonValue,
	): Promise<void> {
		if (
			typeof fields !== 'object' ||
			!fields ||
			!('title' in fields) ||
			!('description' in fields) ||
			!('fileUrl' in fields)
		) {
			throw new Error(
				'Los campos "title", "description" y "fileUrl" son requeridos en los datos de entrada.',
			);
		}

		try {
			// Descargar el archivo de video
			const videoResponse = await axios.get(fields.fileUrl as string, {
				responseType: 'arraybuffer',
			});
			const videoBuffer = Buffer.from(videoResponse.data);

			// Configurar el cliente de YouTube
			const oauth2Client = new google.auth.OAuth2();
			oauth2Client.setCredentials({ access_token: token });

			// Crear la solicitud de subida para Shorts
			await this.youtube.videos.insert({
				auth: oauth2Client,
				part: ['snippet', 'status'],
				requestBody: {
					snippet: {
						title: fields.title as string,
						description: `${fields.description as string} #Shorts`,
						categoryId: '22',
					},
					status: {
						privacyStatus: 'public',
						selfDeclaredMadeForKids: false,
					},
				},
				media: {
					body: videoBuffer,
				},
			});
		} catch (error) {
			let errorMessage = 'Error en la publicación del short';
			if (axios.isAxiosError(error)) {
				errorMessage =
					error.response?.data?.error?.message || error.message;
			} else if (error instanceof Error) {
				errorMessage = error.message;
			}
			throw new Error(
				`Error en la publicación del short: ${errorMessage}`,
			);
		}
	}
}
