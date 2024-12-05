import { Module } from '@nestjs/common';
import { PrismaService } from './core/prisma.service';
import Modules from './lib';
import { ResponseInterceptor } from './lib/ResponseInterceptor';
import { AppController } from './app.controller';
import { JwtService } from '@nestjs/jwt';
import { LoggerConfiguredModule } from './lib/logger.config';
import { CustomerModule } from './modules/customer/customer.module';
import { S3GlobalModule } from './common/s3-config/s3-module';

@Module({
  imports: [...Modules, LoggerConfiguredModule, S3GlobalModule.register()],
  controllers: [AppController],
  providers: [PrismaService, ResponseInterceptor, JwtService],
})
export class AppModule { }
