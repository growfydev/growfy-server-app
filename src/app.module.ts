import { Module } from '@nestjs/common';
import { PrismaService } from './core/prisma.service';
import { SetupModule } from './config/setup.module';

@Module({
  imports: [SetupModule],
  providers: [PrismaService],
})
export class AppModule {}
