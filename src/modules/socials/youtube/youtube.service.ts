import {
	Injectable,
	Logger,
	InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import * as fs from 'fs';
import { UploadVideoDto } from './types/upload-video.dto';
import { UploadShortDto } from './types/upload-short.dto';

@Injectable()
export class YouTubeService {
	private readonly logger = new Logger(YouTubeService.name);
	private oauth2Client: OAuth2Client;
	private youtube: any;

	constructor(private configService: ConfigService) {
		console.log(this.configService.get('youtube.clientId'));
		const clientId = '';
		const clientSecret = '';
		const redirectUri = '';

		console.log('HOLA MUNDO');
		this.oauth2Client = new google.auth.OAuth2(
			clientId,
			clientSecret,
			redirectUri,
		);
	}

	generateAuthUrl(): string {
		const scopes = this.configService.get('youtube.scopes');
		return this.oauth2Client.generateAuthUrl({
			access_type: 'offline',
			scope: scopes,
		});
	}

	async setCredentials(code: string): Promise<void> {
		try {
			const { tokens } = await this.oauth2Client.getToken(code);
			this.oauth2Client.setCredentials(tokens);

			if (tokens.refresh_token) {
				// Guarda el refresh_token de forma segura (base de datos o almacenamiento encriptado)
				this.logger.log(
					'Refresh token obtained:',
					tokens.refresh_token,
				);
			}

			this.youtube = google.youtube({
				version: 'v3',
				auth: this.oauth2Client,
			});

			this.logger.log('Access token obtained:', tokens.access_token);
		} catch (error) {
			console.log(error);
			this.logger.error('Credential setup failed', error);
			throw new InternalServerErrorException(
				'YouTube authentication failed',
			);
		}
	}

	async uploadVideo(
		file: Express.Multer.File,
		options: UploadVideoDto,
	): Promise<string[]> {
		if (!this.youtube) {
			throw new InternalServerErrorException(
				'YouTube client not initialized',
			);
		}

		try {
			const response = await this.youtube.videos.insert({
				part: 'snippet,status',
				requestBody: {
					snippet: {
						title: options.title,
						description: options.description,
						tags: options.tags || [],
						categoryId: options.categoryId || '22',
					},
					status: {
						privacyStatus: options.privacyStatus || 'private',
					},
				},
				media: {
					body: fs.createReadStream(file.path),
				},
			});

			this.logger.log(`Video uploaded. ID: ${response.data.id}`);
			return response.data;
		} catch (error) {
			this.logger.error('Video upload failed', error);
			throw new InternalServerErrorException('Video upload failed');
		}
	}

	async uploadShort(
		file: Express.Multer.File,
		options: UploadShortDto,
	): Promise<string[]> {
		if (!this.youtube) {
			throw new InternalServerErrorException(
				'YouTube client not initialized',
			);
		}

		try {
			const response = await this.youtube.videos.insert({
				part: 'snippet,status',
				requestBody: {
					snippet: {
						title: options.title,
						description: `${options.description}\n\n#Shorts`,
						tags: ['#Shorts', ...(options.tags || [])],
					},
					status: {
						privacyStatus: options.privacyStatus || 'private',
					},
				},
				media: {
					body: fs.createReadStream(file.path),
				},
			});

			this.logger.log(`Short uploaded. ID: ${response.data.id}`);
			return response.data;
		} catch (error) {
			this.logger.error('Short upload failed', error);
			throw new InternalServerErrorException('Short upload failed');
		}
	}
}
