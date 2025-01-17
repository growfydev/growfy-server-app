import { Module } from '@nestjs/common';
import { ShopifyDataService } from './shopify.data.service';
import { ShopifyAuthService } from './shopify.auth.service';
import { ShopifyController } from './shopify.controller';
import { ShopifyCronService } from './shopify.cron.service';
import { PrismaService } from 'src/core/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { AuthModule } from '../auth/auth.module';

@Module({
	imports: [AuthModule],
	controllers: [ShopifyController],
	providers: [
		ShopifyAuthService,
		ShopifyDataService,
		ShopifyCronService,
		PrismaService,
		JwtService,
	],
})
export class ShopifyModule {}
