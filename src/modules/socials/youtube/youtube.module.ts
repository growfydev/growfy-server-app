import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { YouTubeService } from './youtube.service';
import { YouTubeController } from './youtube.controller';
import youtubeConfig from '../../../common/youtube.config';

@Module({
	imports: [
		ConfigModule.forRoot({
			load: [youtubeConfig],
		}),
		MulterModule.register({
			dest: './uploads',
		}),
	],
	controllers: [YouTubeController],
	providers: [YouTubeService],
})
export class YouTubeModule {}
