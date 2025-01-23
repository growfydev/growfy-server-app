import { Module } from '@nestjs/common';
import { ShopifyDataService } from './services/shopify.data.service';
import { ShopifyAuthService } from './services/shopify.auth.service';
import { ShopifyController } from './shopify.controller';
import { ShopifyCronService } from './services/shopify.cron.service';
import { PrismaService } from 'src/core/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { AuthModule } from '../auth/auth.module';
import { ShopifyWebhookService } from './services/shopify.webhooks.service';

@Module({
	imports: [AuthModule],
	controllers: [ShopifyController],
	providers: [
		ShopifyAuthService,
		ShopifyDataService,
		ShopifyCronService,
		ShopifyWebhookService,
		PrismaService,
		JwtService,
	],
})
export class ShopifyModule {}
