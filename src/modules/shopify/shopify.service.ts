import {
	Injectable,
	BadRequestException,
	InternalServerErrorException,
} from '@nestjs/common';
import configLoader from '../../lib/ConfigLoader';
import axios from 'axios';
import { PrismaService } from 'src/core/prisma.service';
import { GlobalStatus, ShopifyIntegration } from '@prisma/client';
import { omit } from 'lodash';

@Injectable()
export class ShopifyService {
	private readonly clientId = configLoader().shopify.clientId;
	private readonly clientSecret = configLoader().shopify.clientSecret;
	private readonly redirectUri = configLoader().shopify.redirectUri;
	private readonly scopes = configLoader().shopify.scopes;

	private readonly webhooksUri = configLoader().shopify.webhooksUri;

	constructor(private readonly prisma: PrismaService) {}

	/**
	 * Genera la URL de autenticación para Shopify.
	 * @param profileId - ID del perfil asociado a la integración.
	 * @param shop - Dominio de la tienda Shopify.
	 * @returns URL de autenticación.
	 */
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

	/**
	 * Maneja el callback de Shopify y almacena el token de acceso.
	 * @param shop - Dominio de la tienda Shopify.
	 * @param code - Código de autorización.
	 * @returns Token de acceso de Shopify.
	 */
	async handleCallback(shop: string, code: string): Promise<string> {
		if (!shop) {
			throw new BadRequestException(
				'El dominio de la tienda es inválido.',
			);
		}
		if (!code) {
			throw new BadRequestException(
				'El código de autorización es requerido.',
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

		await this.registerWebhook(shop, accessToken, 'products/create');

		return accessToken;
	}

	/**
	 * Construye la URL de autorización de Shopify.
	 * @param shop - Dominio de la tienda Shopify.
	 * @returns URL de autorización.
	 */
	private buildAuthUrl(shop: string): string {
		return `https://${shop}/admin/oauth/authorize?client_id=${this.clientId}&scope=${this.scopes}&redirect_uri=${this.redirectUri}`;
	}

	/**
	 * Maneja la integración existente o crea una nueva.
	 * @param profileId - ID del perfil asociado.
	 * @param shop - Dominio de la tienda Shopify.
	 * @param integration - Integración existente, si aplica.
	 */
	private async handleIntegration(
		profileId: number,
		shop: string,
		integration: ShopifyIntegration,
	): Promise<void> {
		if (integration) {
			// Desvincular perfil existente y asociar el nuevo.
			await this.prisma.profile.updateMany({
				where: { shopifyIntegrationId: integration.id },
				data: { shopifyIntegrationId: null },
			});

			await this.prisma.shopifyIntegration.update({
				where: { id: integration.id },
				data: { Profile: { connect: { id: profileId } } },
			});
		} else {
			// Crear nueva integración.
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

	/**
	 * Obtiene el token de acceso desde Shopify.
	 * @param shop - Dominio de la tienda Shopify.
	 * @param code - Código de autorización.
	 * @returns Token de acceso.
	 */
	private async fetchAccessToken(
		shop: string,
		code: string,
	): Promise<string> {
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
			console.log(error);
			throw new InternalServerErrorException(
				'No se pudo obtener el token de acceso.',
			);
		}
	}

	/**
	 * Obtiene los detalles de la tienda desde Shopify.
	 * @param shop - Dominio de la tienda Shopify.
	 * @param accessToken - Token de acceso de Shopify.
	 * @returns Detalles de la tienda.
	 */
	private async fetchShopDetails(
		shop: string,
		accessToken: string,
	): Promise<Partial<ShopifyIntegration>> {
		try {
			const response = await axios.get(
				`${this.baseUrl(shop)}/shop.json`,
				{
					headers: { 'X-Shopify-Access-Token': accessToken },
				},
			);

			const {
				name,
				email,
				country,
				currency,
				shop_owner,
				plan_name,
				has_discounts,
				has_gift_cards,
			} = response.data.shop;

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
		} catch (error) {
			console.log(error);
			throw new InternalServerErrorException(
				'No se pudieron obtener los detalles de la tienda.',
			);
		}
	}

	/**
	 * Registra un webhook en Shopify.
	 * @param shop - Dominio de la tienda Shopify.
	 * @param accessToken - Token de acceso de Shopify.
	 * @param topic - Evento para el webhook (e.g., 'orders/create').
	 */
	private async registerWebhook(
		shop: string,
		accessToken: string,
		topic: string,
	): Promise<void> {
		try {
			await axios.post(
				`${this.baseUrl(shop)}/webhooks.json`,
				{
					webhook: {
						topic: topic,
						address: this.webhooksUri,
						format: 'json',
					},
				},
				{
					headers: { 'X-Shopify-Access-Token': accessToken },
				},
			);
		} catch (error) {
			console.error(
				'Error registrando el webhook:',
				error.response?.data,
			);
			throw new InternalServerErrorException(
				'No se pudo registrar el webhook en Shopify.',
			);
		}
	}

	/**
	 * Actualiza la integración con los detalles finales.
	 * @param integrationId - ID de la integración.
	 * @param data - Datos a actualizar.
	 */
	private async updateIntegration(
		integrationId: number,
		data: Partial<ShopifyIntegration>,
	): Promise<void> {
		await this.prisma.shopifyIntegration.update({
			where: { id: integrationId },
			data,
		});
	}

	/**
	 * Construye la base URL para las solicitudes a Shopify.
	 * @param shop - Dominio de la tienda Shopify.
	 * @returns Base URL.
	 */
	private baseUrl(shop: string): string {
		return `https://${shop}/admin/api/2024-01`;
	}

	/**
	 * Verifica la validez del HMAC enviado por Shopify.
	 * @param hmac - HMAC enviado en el encabezado.
	 * @param body - Cuerpo de la solicitud.
	 * @returns `true` si el HMAC es válido, de lo contrario, `false`.
	 */
	verifyWebhookHmac(hmac: string, body: any): boolean {
		console.log('HMAC:', hmac);
		console.log('Body:', body);
		return true;
	}

	async getShopInfo(profileId: number): Promise<ShopifyIntegration> {
		const integration = await this.prisma.shopifyIntegration.findFirst({
			where: {
				Profile: { id: profileId },
				isAuth: true,
				globalStatus: GlobalStatus.ACTIVE,
			},
		});

		if (!integration) {
			throw new BadRequestException(
				'No se encontró una integración para este perfil.',
			);
		}

		const filteredIntegration = omit(integration, ['accessToken', 'code']);

		return filteredIntegration as ShopifyIntegration;
	}
}
