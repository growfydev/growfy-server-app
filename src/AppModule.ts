import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AppController } from './app.controller';
import { PrismaService } from './core/prisma.service';
import { Modules } from './lib';
import { ResponseInterceptor } from './lib/ResponseInterceptor';

@Module({
  imports: Modules,
  controllers: [AppController],
  providers: [PrismaService, ResponseInterceptor, JwtService],
})
export class AppModule {}
