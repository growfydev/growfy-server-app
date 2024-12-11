import {
	Body,
	Controller,
	Get,
	Param,
	Post,
	UploadedFile,
	UseInterceptors,
} from '@nestjs/common';
import { S3Service } from 'src/common/s3-config';
import { Auth } from 'src/modules/auth/decorators/auth.decorator';
import { Role } from '@prisma/client';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller()
export class AppController {
	constructor(private readonly s3Service: S3Service) {}

	@Get('s3/presigned-url/:key')
	@Auth([Role.USER, Role.ADMIN])
	async getPresidedUrl(@Param('key') key: string) {
		try {
			const presignedUrl = await this.s3Service.getFile(key);
			return { url: presignedUrl };
		} catch (error) {
			return {
				message: `Error generating presigned URL: ${error.message}`,
			};
		}
	}

	@Post('s3/upload')
	@Auth([Role.USER, Role.ADMIN])
	@UseInterceptors(FileInterceptor('file'))
	async uploadFile(
		@UploadedFile() file: Express.Multer.File,
		@Body('folder') folder: string,
	) {
		const uploadedUrl = await this.s3Service.uploadFile(
			file,
			folder || 'uploads',
		);
		return { url: uploadedUrl };
	}
}
