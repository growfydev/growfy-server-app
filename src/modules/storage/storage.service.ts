import {
	Injectable,
	NotFoundException,
	InternalServerErrorException,
} from '@nestjs/common';
import { Dropbox } from 'dropbox';
import { google, drive_v3 } from 'googleapis';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import configLoader from '../../lib/ConfigLoader';
import { StorageFile, StorageListResponse } from './types/interface';
import { StorageServiceTypes } from './types/enum';

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

	generateAuthUrl(profileId: number, service: StorageServiceTypes): string {
		switch (service) {
			case StorageServiceTypes.GOOGLE_DRIVE:
				return this.generateGoogleDriveAuthUrl(profileId);
			case StorageServiceTypes.DROPBOX:
				return this.generateDropboxAuthUrl(profileId);
			default:
				throw new Error('Servicio no soportado');
		}
	}

	// URL de autorización para Google Drive
	private generateGoogleDriveAuthUrl(profileId: number): string {
		const oauth2Client = this.createGoogleOAuth2Client();
		return oauth2Client.generateAuthUrl({
			access_type: 'offline',
			scope: ['https://www.googleapis.com/auth/drive'],
			state: JSON.stringify({ profileId }),
		});
	}

	private generateDropboxAuthUrl(profileId: number): string {
		const clientId = configLoader().dropbox.clientId;
		const redirectUri = configLoader().dropbox.redirect;

		return `https://www.dropbox.com/oauth2/authorize?client_id=${clientId}&response_type=code&token_access_type=offline&require_role=work&redirect_uri=${redirectUri}&state=${profileId}`;
	}
	async setCredentials(
		profileId: number,
		service: StorageServiceTypes,
		code: string,
	): Promise<void> {
		switch (service) {
			case StorageServiceTypes.GOOGLE_DRIVE:
				await this.setGoogleDriveCredentials(profileId, code);
				break;
			case StorageServiceTypes.DROPBOX:
				await this.setDropboxCredentials(profileId, code);
				break;
			default:
				throw new Error('Servicio no soportado');
		}
	}

	// Configurar credenciales de Google Drive
	private async setGoogleDriveCredentials(
		profileId: number,
		code: string,
	): Promise<void> {
		try {
			const oauth2Client = this.createGoogleOAuth2Client();
			const { tokens } = await oauth2Client.getToken(code);

			await this.saveToken(
				profileId,
				StorageServiceTypes.GOOGLE_DRIVE,
				tokens.access_token!,
				tokens.refresh_token,
				tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
			);
		} catch (error) {
			throw new InternalServerErrorException(
				'Error setting Google Drive credentials: ' + error.message,
			);
		}
	}

	// Configurar credenciales de Dropbox
	private async setDropboxCredentials(
		profileId: number,
		code: string,
	): Promise<void> {
		try {
			const clientId = configLoader().dropbox.clientId;
			const clientSecret = configLoader().dropbox.clientSecret;
			const redirectUri = configLoader().dropbox.redirect;

			const response = await fetch(
				'https://api.dropboxapi.com/oauth2/token',
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/x-www-form-urlencoded',
					},
					body: new URLSearchParams({
						code,
						grant_type: 'authorization_code',
						client_id: clientId,
						client_secret: clientSecret,
						redirect_uri: redirectUri,
					}),
				},
			);

			const tokens = await response.json();

			await this.saveToken(
				profileId,
				StorageServiceTypes.DROPBOX,
				tokens.access_token,
				tokens.refresh_token,
				tokens.expires_in
					? new Date(Date.now() + tokens.expires_in * 1000)
					: undefined,
			);
		} catch (error) {
			throw new InternalServerErrorException(
				'Error setting Dropbox credentials: ' + error.message,
			);
		}
	}

	// Listar archivos
	async listFiles(
		profileId: number,
		service: StorageServiceTypes,
		pageToken?: string,
		pageSize: number = 50,
	): Promise<StorageListResponse> {
		switch (service) {
			case StorageServiceTypes.GOOGLE_DRIVE:
				return this.listGoogleDriveFiles(
					profileId,
					pageToken,
					pageSize,
				);
			case StorageServiceTypes.DROPBOX:
				return; //this.listDropboxFiles(profileId, pageToken, pageSize);
			default:
				throw new Error('Servicio no soportado');
		}
	}

	// Listar archivos de Google Drive
	private async listGoogleDriveFiles(
		profileId: number,
		pageToken?: string,
		pageSize: number = 50,
	): Promise<StorageListResponse> {
		const oauth2Client = await this.loadGoogleToken(profileId);
		const drive = google.drive({ version: 'v3', auth: oauth2Client });

		try {
			const res = await drive.files.list({
				pageSize: pageSize,
				pageToken: pageToken || undefined,
				fields: 'nextPageToken, files(id, name, mimeType, webViewLink, thumbnailLink)',
			});

			return {
				files: res.data.files
					? res.data.files.map((file) => ({
							id: file.id!,
							name: file.name!,
							mimeType: file.mimeType!,
							webViewLink: file.webViewLink,
						}))
					: [],
				nextPageToken: res.data.nextPageToken,
			};
		} catch (error) {
			console.error('Error listing Google Drive files:', error);
			throw error;
		}
	}

	// Listar archivos de Dropbox
	// private async listDropboxFiles(
	//     profileId: number,
	//     cursor?: string, // Add '?' to make 'cursor' optional
	//     limit: number = 50,
	// ): Promise<StorageListResponse> {
	//     const dbx = await this.loadDropboxClient(profileId);

	//     try {
	//         const result = await dbx.filesListFolder({
	//             path: '',
	//             limit,
	//             // cursor: cursor, // Use 'cursor' directly without '?'
	//         });

	//         return {
	// 			files: result,
	//             // files: result.entries.map(file => ({
	//             //     id: file.id,
	//             //     name: file.name,
	//             //     mimeType: file['.tag'],
	//             //     webViewLink: null,
	//             // })),
	//             nextPageToken: result.cursor, // Fixed property access
	//             hasMore: result.has_more, // Fixed property access
	//         };
	//     } catch (error) {
	//         console.error('Error listing Dropbox files:', error);
	//         throw error;
	//     }
	// }

	// Subir archivo
	async uploadFile(
		profileId: number,
		service: StorageServiceTypes,
		filePath: string,
	): Promise<StorageFile> {
		switch (service) {
			case StorageServiceTypes.GOOGLE_DRIVE:
				return this.uploadGoogleDriveFile(profileId, filePath);
			case StorageServiceTypes.DROPBOX:
				return this.uploadDropboxFile(profileId, filePath);
			default:
				throw new Error('Servicio no soportado');
		}
	}

	// Subir archivo a Google Drive
	private async uploadGoogleDriveFile(
		profileId: number,
		filePath: string,
	): Promise<StorageFile> {
		const oauth2Client = await this.loadGoogleToken(profileId);
		const drive = google.drive({ version: 'v3', auth: oauth2Client });

		try {
			const fileName = path.basename(filePath);
			const mimeType = this.getMimeType(fileName);

			const res = await drive.files.create({
				requestBody: {
					name: fileName,
				},
				media: {
					mimeType,
					body: fs.createReadStream(filePath),
				},
			});

			return {
				id: res.data.id!,
				name: res.data.name!,
				mimeType: res.data.mimeType!,
				webViewLink: res.data.webViewLink,
			};
		} catch (error) {
			throw new InternalServerErrorException(
				'Error uploading file to Google Drive: ' + error.message,
			);
		}
	}

	// Subir archivo a Dropbox
	// Subir archivo a Dropbox
	private async uploadDropboxFile(
		profileId: number,
		filePath: string,
	): Promise<StorageFile> {
		const dbx = await this.loadDropboxClient(profileId);

		try {
			const fileName = path.basename(filePath);
			const fileContent = fs.readFileSync(filePath);

			const response = await dbx.filesUpload({
				path: `/${fileName}`,
				contents: fileContent,
				mode: { '.tag': 'add' },
				autorename: true,
				mute: false,
			});

			return {
				id: response.result.id, // Fixed property access
				name: response.result.name,
				mimeType: response.result['.tag'],
				webViewLink: null,
			};
		} catch (error) {
			throw new InternalServerErrorException(
				'Error uploading file to Dropbox: ' + error.message,
			);
		}
	}

	// Eliminar archivo
	async deleteFile(
		profileId: number,
		service: StorageServiceTypes,
		fileId: string,
	): Promise<void> {
		switch (service) {
			case StorageServiceTypes.GOOGLE_DRIVE:
				await this.deleteGoogleDriveFile(profileId, fileId);
				break;
			case StorageServiceTypes.DROPBOX:
				await this.deleteDropboxFile(profileId, fileId);
				break;
			default:
				throw new Error('Servicio no soportado');
		}
	}

	// Eliminar archivo de Google Drive
	private async deleteGoogleDriveFile(
		profileId: number,
		fileId: string,
	): Promise<void> {
		const oauth2Client = await this.loadGoogleToken(profileId);
		const drive = google.drive({ version: 'v3', auth: oauth2Client });

		try {
			await drive.files.delete({ fileId });
		} catch (error) {
			console.error('Error deleting Google Drive file:', error);
			throw new InternalServerErrorException(
				`Failed to delete file: ${error.message}`,
			);
		}
	}

	// Eliminar archivo de Dropbox
	private async deleteDropboxFile(
		profileId: number,
		fileId: string,
	): Promise<void> {
		const dbx = await this.loadDropboxClient(profileId);

		try {
			await dbx.filesDelete({ path: fileId });
		} catch (error) {
			console.error('Error deleting Dropbox file:', error);
			throw new InternalServerErrorException(
				`Failed to delete file: ${error.message}`,
			);
		}
	}

	// Guardar token en base de datos
	private async saveToken(
		profileId: number,
		service: StorageServiceTypes,
		accessToken: string,
		refreshToken?: string,
		expiryDate?: Date,
	): Promise<void> {
		try {
			const existingRecord = await this.prisma.storageProfile.findUnique({
				where: {
					profileId_service: { profileId, service },
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
						service,
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

	// Crear cliente OAuth2 para Google Drive
	private createGoogleOAuth2Client() {
		return new google.auth.OAuth2(
			configLoader().google.drive.clientId,
			configLoader().google.drive.clientSecret,
			configLoader().google.drive.redirectUri,
		);
	}

	// Cargar token de Google Drive
	private async loadGoogleToken(profileId: number) {
		const tokenRecord = await this.prisma.storageProfile.findUnique({
			where: {
				profileId_service: {
					profileId,
					service: StorageServiceTypes.GOOGLE_DRIVE,
				},
			},
		});

		if (!tokenRecord) {
			throw new NotFoundException(
				'Google Drive token not found for the given profile.',
			);
		}

		const oauth2Client = this.createGoogleOAuth2Client();
		oauth2Client.setCredentials({
			access_token: tokenRecord.accessToken,
			refresh_token: tokenRecord.refreshToken,
			expiry_date: tokenRecord.expiryDate?.getTime(),
		});

		return oauth2Client;
	}

	// Cargar cliente Dropbox
	private async loadDropboxClient(profileId: number) {
		const tokenRecord = await this.prisma.storageProfile.findUnique({
			where: {
				profileId_service: {
					profileId,
					service: StorageServiceTypes.DROPBOX,
				},
			},
		});

		if (!tokenRecord) {
			throw new NotFoundException(
				'Dropbox token not found for the given profile.',
			);
		}

		return new Dropbox({
			accessToken: tokenRecord.accessToken,
			refreshToken: tokenRecord.refreshToken,
		});
	}

	// Utilidad para obtener mime type
	private getMimeType(fileName: string): string {
		const ext = path.extname(fileName).toLowerCase();
		const mimeTypes: { [key: string]: string } = {
			'.txt': 'text/plain',
			'.pdf': 'application/pdf',
			'.doc': 'application/msword',
			'.docx':
				'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
			'.jpg': 'image/jpeg',
			'.jpeg': 'image/jpeg',
			'.png': 'image/png',
			// Agrega más tipos según necesites
			default: 'application/octet-stream',
		};
		return mimeTypes[ext] || mimeTypes.default;
	}
}
