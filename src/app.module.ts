import { Module } from '@nestjs/common';
import { PrismaService } from './core/prisma.service';
import { Modules } from './lib';
import { ResponseInterceptor } from './lib/ResponseInterceptor';

@Module({
  imports: Modules,
  providers: [PrismaService, ResponseInterceptor],
})
export class AppModule { }
