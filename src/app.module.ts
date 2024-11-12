import { Module } from '@nestjs/common';
import { PrismaService } from './core/prisma.service';
import { Modules } from './lib';

@Module({
  imports: Modules,
  providers: [PrismaService],
})
export class AppModule {}
