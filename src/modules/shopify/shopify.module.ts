import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ShopifyService } from './shopify.service';
import { ShopifyController } from './shopify.controller';

@Module({
	imports: [ConfigModule.forRoot()],
	controllers: [ShopifyController],
	providers: [ShopifyService],
})
export class ShopifyModule {}
