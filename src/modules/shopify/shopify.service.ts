import {
	Injectable,
	BadRequestException,
	InternalServerErrorException,
} from '@nestjs/common';
import configLoader from '../../lib/ConfigLoader';
import axios from 'axios';
import { PrismaService } from 'src/core/prisma.service';
import { ShopifyIntegration } from '@prisma/client';

@Injectable()
export class ShopifyService {
	private readonly clientId = configLoader().shopify.clientId;
	private readonly clientSecret = configLoader().shopify.clientSecret;
	private readonly redirectUri = configLoader().shopify.redirectUri;
	private readonly scopes = configLoader().shopify.scopes;

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
	): Promise<any> {
		try {
			const response = await axios.get(
				`${this.baseUrl(shop)}/shop.json`,
				{
					headers: { 'X-Shopify-Access-Token': accessToken },
				},
			);
			return response.data.shop;
		} catch (error) {
			console.log(error);
			throw new InternalServerErrorException(
				'No se pudieron obtener los detalles de la tienda.',
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
		data: any,
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
}
