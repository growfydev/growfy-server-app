import { Module } from '@nestjs/common';
import { ProviderService } from './provider.service';
import { ProviderController } from './provider.controller';
import { PrismaService } from 'src/core/prisma.service';
import { AuthModule } from '../auth/auth.module';

@Module({
	imports: [AuthModule],
	controllers: [ProviderController],
	providers: [ProviderService, PrismaService],
	exports: [ProviderService],
})
export class ProviderModule {}
