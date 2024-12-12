import {
	Injectable,
	NotFoundException,
	InternalServerErrorException,
} from '@nestjs/common';
import { google, drive_v3 } from 'googleapis';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import configLoader from '../../lib/ConfigLoader';
import { GoogleDriveFile, UpdatedFileResponse } from './types/interface';

@Injectable()
export class StorageService {
	private oauth2Client;
	private drive: drive_v3.Drive;
	private readonly prisma: PrismaClient;

	constructor() {
		this.oauth2Client = new google.auth.OAuth2(
			configLoader().google.drive.clientId,
			configLoader().google.drive.clientSecret,
			configLoader().google.drive.redirectUri,
		);

		this.drive = google.drive({ version: 'v3', auth: this.oauth2Client });
		this.prisma = new PrismaClient();
	}

	generateAuthUrl(profileId: number): string {
		const baseUrl = this.oauth2Client.generateAuthUrl({
			access_type: 'offline',
			scope: ['https://www.googleapis.com/auth/drive'],
			state: JSON.stringify({ profileId }),
		});

		// const authUrl = `${baseUrl}&profileId=${profileId}`;
		return baseUrl;
	}

	async setCredentials(
		profileId: number,
		service: string,
		code: string,
	): Promise<void> {
		try {
			const { tokens } = await this.oauth2Client.getToken(code);
			this.oauth2Client.setCredentials(tokens);

			await this.saveToken(
				profileId,
				tokens.access_token!,
				tokens.refresh_token,
				tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
			);
		} catch (error) {
			throw new InternalServerErrorException(
				'Error setting credentials: ' + error.message,
			);
		}
	}

	async listFiles(
		profileId: number,
		pageToken?: string,
		pageSize: number = 50,
	): Promise<{
		files: GoogleDriveFile[];
		nextPageToken?: string;
	}> {
		// Load the token for the specific profile and service

		console.log(profileId);
		await this.loadToken(profileId);

		try {
			const res = await this.drive.files.list({
				pageSize: pageSize,
				pageToken: pageToken || undefined,
				fields: 'nextPageToken, files(id, name, mimeType, webViewLink, thumbnailLink)',
			});

			return {
				files: res.data.files
					? (res.data.files as GoogleDriveFile[])
					: [],
				nextPageToken: res.data.nextPageToken,
			};
		} catch (error) {
			console.error('Error listing files:', error);
			throw error;
		}
	}

	async uploadFile(
		profileId: number,
		service: string,
		filePath: string,
		mimeType: string,
	): Promise<drive_v3.Schema$File | null> {
		try {
			await this.loadToken(profileId);

			const fileName = path.basename(filePath);

			const res = await this.drive.files.create({
				requestBody: {
					name: fileName,
				},
				media: {
					mimeType,
					body: fs.createReadStream(filePath),
				},
			});

			return res.data;
		} catch (error) {
			throw new InternalServerErrorException(
				'Error uploading file: ' + error.message,
			);
		}
	}

	private async saveToken(
		profileId: number,
		accessToken: string,
		refreshToken?: string,
		expiryDate?: Date,
	): Promise<void> {
		try {
			const existingRecord = await this.prisma.storageProfile.findUnique({
				where: {
					profileId_service: { profileId, service: 'GOOGLE_DRIVE' },
				},
			});

			if (existingRecord) {
				await this.prisma.storageProfile.update({
					where: { id: existingRecord.id },
					data: {
						accessToken,
						refreshToken,
						expiryDate,
						updatedAt: new Date(),
					},
				});
			} else {
				await this.prisma.storageProfile.create({
					data: {
						profileId,
						service: 'GOOGLE_DRIVE',
						accessToken,
						refreshToken,
						expiryDate,
					},
				});
			}
		} catch (error) {
			throw new InternalServerErrorException(
				'Error saving token: ' + error.message,
			);
		}
	}
	async updateFile(
		profileId: number,
		fileId: string,
		updateFields: {
			name?: string;
			parents?: string[];
			description?: string;
		},
	): Promise<UpdatedFileResponse> {
		await this.loadToken(profileId);

		try {
			const response = await this.drive.files.update({
				fileId: fileId,
				requestBody: {
					...updateFields,
				},
				fields: 'id, name, mimeType, webViewLink',
			});

			return {
				id: response.data.id!,
				name: response.data.name!,
				mimeType: response.data.mimeType!,
				webViewLink: response.data.webViewLink!,
			};
		} catch (error) {
			console.error('Error updating file:', error);
			throw new Error(`Failed to update file: ${error.message}`);
		}
	}

	async deleteFile(
		profileId: number,
		service: string,
		fileId: string,
	): Promise<void> {
		await this.loadToken(profileId);

		try {
			await this.drive.files.delete({
				fileId: fileId,
			});
		} catch (error) {
			console.error('Error deleting file:', error);

			if (error.response && error.response.status === 404) {
				throw new Error('File not found');
			}

			throw new Error(`Failed to delete file: ${error.message}`);
		}
	}
	private async loadToken(profileId: number): Promise<void> {
		try {
			const tokenRecord = await this.prisma.storageProfile.findUnique({
				where: {
					profileId_service: {
						profileId,
						service: 'GOOGLE_DRIVE',
					},
				},
			});

			if (!tokenRecord) {
				throw new NotFoundException(
					'Token not found for the given profile and service.',
				);
			}

			this.oauth2Client.setCredentials({
				access_token: tokenRecord.accessToken,
				refresh_token: tokenRecord.refreshToken,
				expiry_date: tokenRecord.expiryDate?.getTime(),
			});
		} catch (error) {
			console.error('Error loading token:', error);
			throw new InternalServerErrorException(
				'Error loading token: ' + error.message,
			);
		}
	}
}
