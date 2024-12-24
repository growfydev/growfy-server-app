import { Module } from '@nestjs/common';
import { ShopifyService } from './shopify.service';
import { ShopifyController } from './shopify.controller';
import { PrismaService } from 'src/core/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { AuthModule } from '../auth/auth.module';

@Module({
	imports: [AuthModule],
	controllers: [ShopifyController],
	providers: [ShopifyService, PrismaService, JwtService],
})
export class ShopifyModule {}
