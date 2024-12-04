import {
    Controller,
    Post,
    UploadedFile,
    Body,
    UseInterceptors
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
    ApiTags,
    ApiOperation,
    ApiConsumes,
    ApiBody
} from '@nestjs/swagger';

import { YouTubeService } from './youtube.service';
import { UploadVideoDto } from './types/upload-video.dto';
import { UploadShortDto } from './types/upload-short.dto';
import { FileUpload } from '../../../decorators/file-upload.decorator';

@ApiTags('YouTube')
@Controller('youtube')
export class YouTubeController {
    constructor(private readonly youtubeService: YouTubeService) { }

    @Post('auth-url')
    @ApiOperation({ summary: 'Generate YouTube OAuth URL' })
    generateAuthUrl(): { authUrl: string } {
        return { authUrl: this.youtubeService.generateAuthUrl() };
    }

    @Post('upload-video')
    @ApiOperation({ summary: 'Upload a standard YouTube video' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        description: 'Video upload',
        type: UploadVideoDto
    })
    @UseInterceptors(FileInterceptor('file'))
    async uploadVideo(
        @UploadedFile() file: Express.Multer.File,
        @Body() dto: any
    ) {
        return this.youtubeService.uploadVideo(file, dto);
    }

    @Post('oauth2callback')
    @ApiOperation({ summary: 'Handle YouTube OAuth callback' })
    async handleCallback(@Body() body: { code: string }) {
        await this.youtubeService.setCredentials(body.code);
        return { message: 'Authenticated successfully' };
    }


    @Post('upload-short')
    @ApiOperation({ summary: 'Upload a YouTube Short' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        description: 'Short upload',
        type: UploadShortDto
    })
    @UseInterceptors(FileInterceptor('file'))
    async uploadShort(
        @UploadedFile() file: Express.Multer.File,
        @Body() dto: UploadShortDto
    ) {
        return this.youtubeService.uploadShort(file, dto);
    }
}