import { Module } from '@nestjs/common';
import { PrismaService } from './core/prisma.service';
import Modules from './lib';
import { ResponseInterceptor } from './lib/ResponseInterceptor';
import { AppController } from './app.controller';
import { JwtService } from '@nestjs/jwt';
import { LoggerConfiguredModule } from './lib/Logger';
import { S3GlobalModule } from './common/s3-config/s3-module';
import { S3Service } from './common/s3-config';
import { NotificationService } from './modules/notification/notification.service';
import { TickesModule } from './tickest/tickes.module';

@Module({
	imports: [
		...Modules,
		LoggerConfiguredModule,
		S3GlobalModule.register(),
		TickesModule,
	],
	controllers: [AppController],
	providers: [
		PrismaService,
		ResponseInterceptor,
		JwtService,
		S3Service,
		NotificationService,
	],
})
export class AppModule {}
