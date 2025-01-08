import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/core/prisma.service';
import { ShopifyIntegration } from '@prisma/client';
import configLoader from '../../lib/ConfigLoader';
import axios from 'axios';
import {
	createAdminApiClient,
	createAdminRestApiClient,
} from '@shopify/admin-api-client';
import { Service } from 'src/service';

@Injectable()
export class ShopifyAuthService extends Service {
	private readonly clientId = configLoader().shopify.clientId;
	private readonly clientSecret = configLoader().shopify.clientSecret;
	private readonly redirectUri = configLoader().shopify.redirectUri;
	private readonly scopes = configLoader().shopify.scopes;
	private readonly webhooksUri = configLoader().shopify.webhooksUri;

	constructor(private readonly prisma: PrismaService) {
		super(ShopifyAuthService.name);
	}

	async getAuthUrl(profileId: number, shop: string): Promise<string> {
		if (!shop) {
			throw new BadRequestException(
				'El dominio de la tienda es inválido.',
			);
		}

		const integration = await this.prisma.shopifyIntegration.findFirst({
			where: { shopDomain: shop },
		});

		if (integration?.isAuth) {
			throw new BadRequestException(
				'La tienda ya está integrada en otra cuenta.',
			);
		}

		await this.handleIntegration(profileId, shop, integration);
		return this.buildAuthUrl(shop);
	}

	async handleCallback(shop: string, code: string): Promise<string> {
		if (!shop || !code) {
			throw new BadRequestException(
				'El dominio de la tienda y código de autorización son requeridos.',
			);
		}

		const accessToken = await this.fetchAccessToken(shop, code);
		const integration = await this.prisma.shopifyIntegration.findFirst({
			where: { shopDomain: shop },
		});

		if (!integration) {
			throw new BadRequestException(
				'No se encontró una integración para esta tienda.',
			);
		}

		const shopDetails = await this.fetchShopDetails(shop, accessToken);
		await this.updateIntegration(integration.id, {
			accessToken,
			code,
			isAuth: true,
			...shopDetails,
		});

		await this.setupWebhooks(shop, accessToken);
		return accessToken;
	}

	private createShopifyClient(shop: string, accessToken: string) {
		const storeDomain = shop;
		return {
			restClient: createAdminRestApiClient({
				storeDomain,
				apiVersion: '2025-01',
				accessToken,
			}),
			graphqlClient: createAdminApiClient({
				storeDomain,
				apiVersion: '2025-01',
				accessToken,
			}),
		};
	}

	private async handleIntegration(
		profileId: number,
		shop: string,
		integration: ShopifyIntegration,
	): Promise<void> {
		if (integration) {
			await this.prisma.profile.updateMany({
				where: { shopifyIntegrationId: integration.id },
				data: { shopifyIntegrationId: null },
			});

			await this.prisma.shopifyIntegration.update({
				where: { id: integration.id },
				data: { Profile: { connect: { id: profileId } } },
			});
		} else {
			const newIntegration = await this.prisma.shopifyIntegration.create({
				data: {
					Profile: { connect: { id: profileId } },
					shopDomain: shop,
				},
			});

			await this.prisma.profile.update({
				where: { id: profileId },
				data: { shopifyIntegrationId: newIntegration.id },
			});
		}
	}

	private buildAuthUrl(shop: string): string {
		return `https://${shop}/admin/oauth/authorize?client_id=${this.clientId}&scope=${this.scopes}&redirect_uri=${this.redirectUri}`;
	}

	private async fetchAccessToken(
		shop: string,
		code: string,
	): Promise<string> {
		// Mantenemos try-catch aquí ya que es una llamada externa crucial
		try {
			const response = await axios.post(
				`https://${shop}/admin/oauth/access_token`,
				{
					client_id: this.clientId,
					client_secret: this.clientSecret,
					code,
				},
			);
			return response.data.access_token;
		} catch (error) {
			this.logger.error(error);
			throw new BadRequestException(
				'Error al obtener el token de acceso.',
			);
		}
	}

	private async fetchShopDetails(
		shop: string,
		accessToken: string,
	): Promise<Partial<ShopifyIntegration>> {
		const { restClient } = this.createShopifyClient(shop, accessToken);
		const response = await restClient.get('shop');

		if (!response.ok) {
			throw new BadRequestException(
				'No se pudieron obtener los detalles de la tienda.',
			);
		}

		const { shop: shopData } = await response.json();
		const {
			name,
			email,
			country,
			currency,
			shop_owner,
			plan_name,
			has_discounts,
			has_gift_cards,
		} = shopData;

		return {
			shopName: name,
			shopEmail: email,
			shopCountry: country,
			shopCurrency: currency,
			shopOwner: shop_owner,
			shopPlan: plan_name,
			hasDiscounts: has_discounts,
			hasGiftCards: has_gift_cards,
		};
	}

	private async setupWebhooks(
		shop: string,
		accessToken: string,
	): Promise<void> {
		const webhookTopics = ['orders/create', 'orders/updated'];
		const { restClient } = this.createShopifyClient(shop, accessToken);

		const response = await restClient.get('webhooks');
		if (!response.ok) {
			throw new BadRequestException(
				'Error al obtener webhooks existentes.',
			);
		}

		const existingWebhooks = await response.json();

		// Eliminar webhooks existentes
		for (const webhook of existingWebhooks.webhooks) {
			if (webhookTopics.includes(webhook.topic)) {
				await restClient.delete(`webhooks/${webhook.id}`);
			}
		}

		// Registrar nuevos webhooks
		for (const topic of webhookTopics) {
			await restClient.post('webhooks', {
				data: {
					webhook: {
						topic,
						address: this.webhooksUri,
						format: 'json',
					},
				},
			});
		}
	}

	private async updateIntegration(
		integrationId: number,
		data: Partial<ShopifyIntegration>,
	): Promise<void> {
		await this.prisma.shopifyIntegration.update({
			where: { id: integrationId },
			data,
		});
	}

	verifyWebhookHmac(hmac: string, body: any): boolean {
		this.logger.log(hmac);
		this.logger.log(body);
		return true;
	}
}
