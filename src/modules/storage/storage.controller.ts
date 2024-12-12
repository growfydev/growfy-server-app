import {
	Controller,
	Get,
	Post,
	Res,
	Body,
	Query,
	HttpStatus,
	HttpException,
	Delete,
	HttpCode,
	Param,
	Patch,
} from '@nestjs/common';
import { StorageService } from './storage.service';
import { Response } from 'express';
import { UpdateFileDto } from './types/dto';

@Controller('storage')
export class StorageController {
	constructor(private readonly storageService: StorageService) {}

	@Get('auth-url')
	// @Auth([Role.USER], [ProfileMemberRoles.OWNER])
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
		@Query('state') state: string,
		@Res() res: Response,
	): Promise<void> {
		try {
			if (!code) {
				res.status(HttpStatus.BAD_REQUEST).json({
					message: 'Missing code parameter',
				});
				return;
			}

			let profileId: number;
			try {
				const parsedState = JSON.parse(state || '{}');
				console.log(parsedState);
				profileId = parseInt(parsedState.profileId);
			} catch (error) {
				res.status(HttpStatus.BAD_REQUEST).json({
					message: 'Invalid state parameter' + error.message,
				});
				return;
			}

			if (!profileId || isNaN(profileId)) {
				res.status(HttpStatus.BAD_REQUEST).json({
					message: 'Invalid or missing profileId',
				});
				return;
			}

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
	// @Auth([Role.USER], [ProfileMemberRoles.OWNER])
	async getFiles(
		@Query('profileId') profileId: string,
		@Query('pageToken') pageToken?: string,
	) {
		try {
			const result = await this.storageService.listFiles(
				parseInt(profileId),
				pageToken,
			);

			return {
				files: result.files,
				nextPageToken: result.nextPageToken,
			};
		} catch (error) {
			throw new HttpException(
				'Failed to retrieve files' + error.message,
				HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	@Post('upload')
	// @Auth([Role.USER], [ProfileMemberRoles.OWNER])
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

	@Patch('files/:fileId')
	async updateFile(
		@Param('fileId') fileId: string,
		@Body() updateDto: UpdateFileDto,
		@Query('profileId') profileId: number,
	) {
		try {
			const updatedFile = await this.storageService.updateFile(
				profileId,
				fileId,
				{
					name: updateDto.name,
					description: updateDto.description,
				},
			);

			return {
				message: 'File updated successfully',
				file: updatedFile,
			};
		} catch (error) {
			throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
		}
	}

	@Delete('files/:fileId')
	@HttpCode(HttpStatus.NO_CONTENT)
	async deleteFile(
		@Param('fileId') fileId: string,
		@Query('profileId') profileId: number,
	) {
		const service = 'GOOGLE_DRIVE';

		try {
			await this.storageService.deleteFile(profileId, service, fileId);
		} catch (error) {
			throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
		}
	}
}
