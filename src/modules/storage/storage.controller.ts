import {
	Controller,
	Get,
	Post,
	Delete,
	Param,
	Body,
	Query,
	Res,
	HttpStatus,
	HttpException,
	HttpCode,
} from '@nestjs/common';
import { Response } from 'express';
import { StorageService } from './storage.service';
import { StorageServiceTypes } from './types/enum';

@Controller('storage')
export class StorageController {
	constructor(private readonly storageService: StorageService) {}

	@Get('auth-url/:service')
	async getAuthUrl(
		@Param('service') service: StorageServiceTypes,
		@Query('profileId') profileId: number,
	) {
		try {
			const authUrl = this.storageService.generateAuthUrl(
				profileId,
				service,
			);
			return { authUrl };
		} catch (error) {
			throw new HttpException(
				'Failed to generate auth URL ' + error.message,
				HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	@Get('oauth2callback')
	async oauth2Callback(
		@Query('code') code: string,
		@Query('state') state: string,
		@Res() res: Response,
	) {
		if (!code) {
			throw new HttpException(
				'Missing code parameter',
				HttpStatus.BAD_REQUEST,
			);
		}

		try {
			const parsedState = JSON.parse(state || '{}');
			const profileId = parseInt(parsedState.profileId, 10);

			if (!profileId || isNaN(profileId)) {
				throw new HttpException(
					'Invalid profileId',
					HttpStatus.BAD_REQUEST,
				);
			}

			// Considera hacer esto configurable o detectar el servicio
			const service = StorageServiceTypes.GOOGLE_DRIVE;
			await this.storageService.setCredentials(profileId, service, code);

			res.status(HttpStatus.OK).json({
				message: 'Authentication successful!',
			});
		} catch (error) {
			throw new HttpException(
				`Authentication failed: ${error.message}`,
				HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	@Get('files/:service')
	async getFiles(
		@Param('service') service: StorageServiceTypes,
		@Query('profileId') profileId: string,
		@Query('pageToken') pageToken?: string,
	) {
		try {
			const result = await this.storageService.listFiles(
				parseInt(profileId, 10),
				service,
				pageToken,
			);

			return {
				files: result.files,
				nextPageToken: result.nextPageToken,
			};
		} catch (error) {
			throw new HttpException(
				`Failed to retrieve files: ${error.message}`,
				HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	@Post('upload')
	async uploadFile(
		@Body()
		body: {
			profileId: number;
			service: StorageServiceTypes;
			filePath: string;
			mimeType: string;
		},
	) {
		const { profileId, service, filePath, mimeType } = body;

		// Validación más concisa
		if (!profileId || !service || !filePath || !mimeType) {
			throw new HttpException(
				'Missing required parameters',
				HttpStatus.BAD_REQUEST,
			);
		}

		try {
			return await this.storageService.uploadFile(
				profileId,
				service,
				filePath,
			);
		} catch (error) {
			throw new HttpException(
				`Failed to upload file: ${error.message}`,
				HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	@Delete('files/:fileId')
	@HttpCode(HttpStatus.NO_CONTENT)
	async deleteFile(
		@Param('fileId') fileId: string,
		@Param('service') service: StorageServiceTypes,
		@Query('profileId') profileId: number,
	) {
		try {
			await this.storageService.deleteFile(profileId, service, fileId);
		} catch (error) {
			throw new HttpException(
				`Failed to delete file: ${error.message}`,
				HttpStatus.BAD_REQUEST,
			);
		}
	}
}
