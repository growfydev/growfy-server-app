import { Module } from '@nestjs/common';
import { PrismaService } from './core/prisma.service';
import Modules from './lib';
import { ResponseInterceptor } from './lib/ResponseInterceptor';
import { AppController } from './app.controller';
import { JwtService } from '@nestjs/jwt';
import { LoggerConfiguredModule } from './lib/logger.config';
import { S3GlobalModule } from './common/s3-config/s3-module';
import { S3Service } from './common/s3-config';

@Module({
	imports: [...Modules, LoggerConfiguredModule, S3GlobalModule.register()],
	controllers: [AppController],
	providers: [PrismaService, ResponseInterceptor, JwtService, S3Service],
})
export class AppModule {}
