import {
	Controller,
	Get,
	Post,
	Req,
	Res,
	Body,
	Query,
	HttpStatus,
} from '@nestjs/common';
import { StorageService } from './storage.service';
import { Response, Request } from 'express';

@Controller('storage')
export class StorageController {
	constructor(private readonly storageService: StorageService) {}

	@Get('auth-url')
	getAuthUrl(
		@Res() res: Response,
		@Query('profileId') profileId: number,
	): void {
		try {
			const url = this.storageService.generateAuthUrl(profileId);
			res.status(HttpStatus.OK).json({ authUrl: url });
		} catch (error) {
			res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
				message: 'Failed to generate auth URL',
				error: error.message,
			});
		}
	}

	@Get('oauth2callback')
	async oauth2Callback(
		@Query('code') code: string,
		@Query('profileId') profileId: number,
		@Res() res: Response,
	): Promise<void> {
		try {
			if (!code) {
				res.status(HttpStatus.BAD_REQUEST).json({
					message: 'Missing code parameter',
				});
				return;
			}
      console.log(profileId)
			const profileIdNumber = Number(profileId);

			if (isNaN(profileIdNumber)) {
				res.status(HttpStatus.BAD_REQUEST).json({
					message: 'Invalid profileId parameter',
				});
				return;
			}
		

			console.log(profileId);

			// Assuming profileId and service are predefined or fetched dynamically

			const service = 'GOOGLE_DRIVE';

			await this.storageService.setCredentials(profileId, service, code);
			res.status(HttpStatus.OK).json({
				message:
					'Authentication successful! You can now interact with Google Drive.',
			});
		} catch (error) {
			console.log(error);
			res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
				message: 'Authentication failed',
				error: error.message,
			});
		}
	}

	@Get('files')
	async listFiles(
		@Query('profileId') profileId: number,
		@Query('service') service: string,
		@Res() res: Response,
	): Promise<void> {
		try {
			if (!profileId || !service) {
				res.status(HttpStatus.BAD_REQUEST).json({
					message: 'Missing profileId or service parameter',
				});
				return;
			}

			const files = await this.storageService.listFiles(
				profileId,
				service,
			);
			res.status(HttpStatus.OK).json(files);
		} catch (error) {
			res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
				message: 'Failed to retrieve files',
				error: error.message,
			});
		}
	}

	@Post('upload')
	async uploadFile(
		@Body('profileId') profileId: number,
		@Body('service') service: string,
		@Body('filePath') filePath: string,
		@Body('mimeType') mimeType: string,
		@Res() res: Response,
	): Promise<void> {
		try {
			if (!profileId || !service || !filePath || !mimeType) {
				res.status(HttpStatus.BAD_REQUEST).json({
					message:
						'Missing required parameters: profileId, service, filePath, or mimeType',
				});
				return;
			}

			const file = await this.storageService.uploadFile(
				profileId,
				service,
				filePath,
				mimeType,
			);
			res.status(HttpStatus.OK).json(file);
		} catch (error) {
			res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
				message: 'Failed to upload file',
				error: error.message,
			});
		}
	}
}
