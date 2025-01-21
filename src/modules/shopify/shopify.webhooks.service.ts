import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/prisma.service';
import { Service } from 'src/service';

@Injectable()
export class ShopifyWebhookService extends Service {
	constructor(private readonly prisma: PrismaService) {
		super(ShopifyWebhookService.name);
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	async ordersCreate(shop: string, body: any) {
		console.error('inicio');
		console.log(
			`Orden creada en la tienda ${shop}:`,
			JSON.stringify(body, null, 2),
		);
		console.error('final');
	}
}
