import { Injectable, BadRequestException } from '@nestjs/common';
import axios from 'axios';
import dayjs from 'dayjs';
import {
	createAdminApiClient,
	createAdminRestApiClient,
} from '@shopify/admin-api-client';
import { GlobalStatus, ShopifyIntegration } from '@prisma/client';

import { PrismaService } from 'src/core/prisma.service';
import configLoader from '../../../lib/ConfigLoader';
import { Service } from 'src/service';
import { GetAllCustomers, parseCustomers } from '../graphql/customers';
import { GetAllProducts, parseProducts } from '../graphql/products';
import { GetOrdersData, parseOrders } from '../graphql/orders';
import {
	ShopifyCustomerResponse,
	ShopifyOrdersResponse,
	ShopifyProductResponse,
} from '../graphql/types';
import { WebhookTopics } from '../common/webhook-topics';
import { ShopifyWebhookBody } from '../common/types';

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

	/**
	 * Genera la URL de autenticación para el proceso OAuth de Shopify.
	 * @param profileId - ID del perfil.
	 * @param shop - Dominio de la tienda.
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

		if (
			integration?.isAuth &&
			integration?.globalStatus === GlobalStatus.ACTIVE
		) {
			throw new BadRequestException(
				'La tienda ya está integrada en otra cuenta.',
			);
		}

		await this.handleIntegration(profileId, shop, integration);
		return this.buildAuthUrl(shop);
	}

	/**
	 * Maneja el callback OAuth y almacena el token de acceso.
	 * @param shop - Dominio de la tienda.
	 * @param code - Código de autorización.
	 */
	async handleCallback(shop: string, code: string): Promise<string> {
		if (!shop || !code) {
			throw new BadRequestException(
				'El dominio de la tienda y código de autorización son requeridos.',
			);
		}

		const accessToken = await this.fetchAccessToken(shop, code);
		const integration = await this.prisma.shopifyIntegration.findFirst({
			where: { shopDomain: shop, globalStatus: GlobalStatus.ACTIVE },
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

		await this.syncShopifyData(integration.profileId);

		return accessToken;
	}

	/**
	 * Sincroniza los datos de Shopify para el perfil dado.
	 * @param profileId - ID del perfil.
	 */
	async syncShopifyData(profileId: number): Promise<void> {
		const integration = await this.prisma.shopifyIntegration.findFirst({
			where: {
				Profile: { id: profileId },
				isAuth: true,
				globalStatus: GlobalStatus.ACTIVE,
			},
		});

		if (!integration) {
			throw new BadRequestException(
				'No se encontró una integración autorizada para este perfil.',
			);
		}

		const { shopDomain, accessToken } = integration;

		await this.syncCustomers(shopDomain, accessToken);
		await this.syncProducts(shopDomain, accessToken);
		await this.syncOrders(shopDomain, accessToken);
	}

	/**
	 * Verifica el HMAC de una solicitud de webhook.
	 * @param hmac - HMAC del encabezado de la solicitud de webhook.
	 * @param body - Cuerpo sin procesar de la solicitud de webhook.
	 */
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	verifyWebhookHmac(hmac: string, body: ShopifyWebhookBody): boolean {
		return true;
	}

	// Métodos privados auxiliares

	/**
	 * Crea clientes de API REST y GraphQL de Shopify.
	 * @param shop - Dominio de la tienda.
	 * @param accessToken - Token de acceso.
	 */
	private createShopifyClient(shop: string, accessToken: string) {
		return {
			restClient: createAdminRestApiClient({
				storeDomain: shop,
				apiVersion: '2025-01',
				accessToken,
			}),
			graphqlClient: createAdminApiClient({
				storeDomain: shop,
				apiVersion: '2025-01',
				accessToken,
			}),
		};
	}

	/**
	 * Maneja el registro de integración en la base de datos.
	 * @param profileId - ID del perfil.
	 * @param shop - Dominio de la tienda.
	 * @param integration - Integración existente, si existe.
	 */
	private async handleIntegration(
		profileId: number,
		shop: string,
		integration: ShopifyIntegration | null,
	): Promise<void> {
		if (integration) {
			await this.prisma.shopifyIntegration.updateMany({
				where: {
					profileId: profileId,
					id: { not: integration.id },
				},
				data: {
					profileId: null,
				},
			});

			await this.prisma.profile.updateMany({
				where: { shopifyIntegrationId: integration.id },
				data: {
					shopifyIntegrationId: null,
				},
			});

			// Vincular la integración al perfil actual
			await this.prisma.shopifyIntegration.update({
				where: { id: integration.id },
				data: { profileId, globalStatus: GlobalStatus.ACTIVE },
			});
		} else {
			// Remove 'profileId' from any ShopifyIntegration with the same 'profileId'
			await this.prisma.shopifyIntegration.updateMany({
				where: {
					profileId: profileId,
				},
				data: {
					profileId: null,
				},
			});

			// Create a new integration and link it to the profile
			const newIntegration = await this.prisma.shopifyIntegration.create({
				data: {
					profileId,
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
	 * Construye la URL de autorización para Shopify OAuth.
	 * @param shop - Dominio de la tienda.
	 */
	private buildAuthUrl(shop: string): string {
		const scopes = encodeURIComponent(this.scopes);
		const redirectUri = encodeURIComponent(this.redirectUri);
		return `https://${shop}/admin/oauth/authorize?client_id=${this.clientId}&scope=${scopes}&redirect_uri=${redirectUri}`;
	}

	/**
	 * Obtiene el token de acceso usando el código de autorización.
	 * @param shop - Dominio de la tienda.
	 * @param code - Código de autorización.
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
			this.logger.error('Error al obtener el token de acceso:', error);
			throw new BadRequestException(
				'Error al obtener el token de acceso.',
			);
		}
	}

	/**
	 * Obtiene detalles de la tienda usando la API de Shopify.
	 * @param shop - Dominio de la tienda.
	 * @param accessToken - Token de acceso.
	 */
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

		return {
			shopName: shopData.name,
			shopEmail: shopData.email,
			shopCountry: shopData.country,
			shopCurrency: shopData.currency,
			shopOwner: shopData.shop_owner,
			shopPlan: shopData.plan_name,
			hasDiscounts: shopData.has_discounts,
			hasGiftCards: shopData.has_gift_cards,
		};
	}

	/**
	 * Configura los webhooks para la integración de Shopify.
	 * @param shop - Dominio de la tienda.
	 * @param accessToken - Token de acceso.
	 */
	private async setupWebhooks(
		shop: string,
		accessToken: string,
	): Promise<void> {
		const webhookTopics = Object.values(WebhookTopics);

		const { restClient } = this.createShopifyClient(shop, accessToken);

		const response = await restClient.get('webhooks');
		if (!response.ok) {
			throw new BadRequestException(
				'Error al obtener webhooks existentes.',
			);
		}

		const existingWebhooksData = await response.json();
		const existingWebhooks = existingWebhooksData.webhooks || [];

		// Eliminar webhooks existentes
		for (const webhook of existingWebhooks) {
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

	/**
	 * Actualiza el registro de integración de Shopify en la base de datos.
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
	 * Sincroniza clientes de Shopify a la base de datos local.
	 * @param shop - Dominio de la tienda.
	 * @param accessToken - Token de acceso.
	 */
	private async syncCustomers(
		shop: string,
		accessToken: string,
	): Promise<void> {
		const integration = await this.prisma.shopifyIntegration.findFirst({
			where: {
				shopDomain: shop,
				isAuth: true,
				globalStatus: GlobalStatus.ACTIVE,
			},
		});

		if (!integration) {
			throw new BadRequestException(
				'No se encontró la integración autorizada para esta tienda.',
			);
		}

		const { graphqlClient } = this.createShopifyClient(shop, accessToken);
		let hasNextPage = true;
		let after: string | undefined = undefined;

		while (hasNextPage) {
			const query = GetAllCustomers(50, after);
			const { data } =
				await graphqlClient.request<ShopifyCustomerResponse>(query);

			const customersData = data.customers.edges.map((edge) => edge.node);

			const customers = parseCustomers(customersData).map((customer) => ({
				...customer,
				profileId: integration.profileId,
			}));

			// Upsert de clientes
			for (const customer of customers) {
				// Primero buscamos si existe el cliente con cualquiera de los campos únicos
				const existingCustomer = await this.prisma.customer.findFirst({
					where: {
						OR: [
							{ shopifyCustomerId: customer.shopifyCustomerId },
							{ email: customer.email },
							{ phone: customer.phone },
						].filter(
							(condition) =>
								// Solo incluimos condiciones donde el valor no sea null o undefined
								Object.values(condition)[0] != null,
						),
					},
				});

				if (existingCustomer) {
					// Si existe, actualizamos
					await this.prisma.customer.update({
						where: {
							id: existingCustomer.id,
						},
						data: {
							...customer,
						},
					});
				} else {
					// Si no existe, creamos uno nuevo
					await this.prisma.customer.create({
						data: customer,
					});
				}
			}

			hasNextPage = data.customers.pageInfo.hasNextPage;
			after = data.customers.pageInfo.endCursor;
		}
		this.logger.log(`Clientes sincronizados para ${shop}`);
	}

	/**
	 * Sincroniza productos de Shopify a la base de datos local.
	 * @param shop - Dominio de la tienda.
	 * @param accessToken - Token de acceso.
	 */
	private async syncProducts(
		shop: string,
		accessToken: string,
	): Promise<void> {
		const integration = await this.prisma.shopifyIntegration.findFirst({
			where: {
				shopDomain: shop,
				isAuth: true,
				globalStatus: GlobalStatus.ACTIVE,
			},
		});

		if (!integration) {
			throw new BadRequestException(
				'No se encontró la integración autorizada para esta tienda.',
			);
		}

		const { graphqlClient } = this.createShopifyClient(shop, accessToken);
		let hasNextPage = true;
		let after: string | undefined = undefined;

		while (hasNextPage) {
			const query = GetAllProducts(50, after);

			const { data, errors } =
				await graphqlClient.request<ShopifyProductResponse>(query);

			if (errors?.graphQLErrors?.length) {
				console.error(JSON.stringify(errors.graphQLErrors, null, 2));
				throw new BadRequestException(
					'Error al obtener datos de productos.',
				);
			}

			const productsData = data.products.edges.map((edge) => edge.node);
			const products = parseProducts(productsData).map((product) => ({
				...product,
				shopifyIntegrationId: integration.id,
			}));

			// Upsert de productos
			for (const product of products) {
				await this.prisma.shopifyProduct.upsert({
					where: { productId: product.productId },
					update: product,
					create: product,
				});
			}

			hasNextPage = data.products.pageInfo.hasNextPage;
			after = data.products.pageInfo.endCursor;
		}
		this.logger.log(`Productos sincronizados para ${shop}`);
	}

	/**
	 * Sincroniza órdenes de Shopify a la base de datos local para el mes anterior y actual.
	 * @param shop - Dominio de la tienda.
	 * @param accessToken - Token de acceso.
	 */
	private async syncOrders(shop: string, accessToken: string): Promise<void> {
		const currentMonthStart = dayjs().startOf('month');
		const previousMonthStart = currentMonthStart.subtract(1, 'month');

		// Sincronizar órdenes del mes anterior
		await this.syncOrdersForRange(
			shop,
			accessToken,
			previousMonthStart,
			previousMonthStart.endOf('month'),
		);

		// Sincronizar órdenes del mes actual
		await this.syncOrdersForRange(
			shop,
			accessToken,
			currentMonthStart,
			currentMonthStart.endOf('month'),
		);

		this.logger.log(`Órdenes sincronizadas para ${shop}`);
	}

	/**
	 * Sincroniza órdenes de Shopify a la base de datos local para un rango de fechas dado.
	 * @param shop - Dominio de la tienda.
	 * @param accessToken - Token de acceso.
	 * @param startDate - Fecha de inicio del rango.
	 * @param endDate - Fecha de fin del rango.
	 */
	private async syncOrdersForRange(
		shop: string,
		accessToken: string,
		startDate: dayjs.Dayjs,
		endDate: dayjs.Dayjs,
	): Promise<void> {
		const integration = await this.prisma.shopifyIntegration.findFirst({
			where: {
				shopDomain: shop,
				isAuth: true,
				globalStatus: GlobalStatus.ACTIVE,
			},
		});

		if (!integration) {
			throw new BadRequestException(
				'No se encontró la integración autorizada para esta tienda.',
			);
		}

		let hasNextPage = true;
		let after: string | undefined = undefined;

		const { graphqlClient } = this.createShopifyClient(shop, accessToken);

		while (hasNextPage) {
			const query = GetOrdersData(
				startDate.format('YYYY-MM-DD'),
				endDate.format('YYYY-MM-DD'),
				50,
				after,
			);

			const { data } =
				await graphqlClient.request<ShopifyOrdersResponse>(query);

			const ordersData = data.orders.edges.map((edge) => edge.node);
			const orders = parseOrders(ordersData, integration.id);

			for (const order of orders) {
				// Upsert de la orden
				const createdOrder = await this.prisma.shopifyOrder.upsert({
					where: { orderId: order.orderId },
					update: {
						...order,
						ShopifyLineItem: undefined,
					},
					create: {
						...order,
						ShopifyLineItem: undefined,
					},
				});

				// Upsert de line items
				for (const lineItem of order.ShopifyLineItem) {
					await this.prisma.shopifyLineItem.upsert({
						where: { lineItemId: lineItem.lineItemId },
						update: {
							...lineItem,
							shopifyOrderId: createdOrder.orderId,
						},
						create: {
							...lineItem,
							shopifyOrderId: createdOrder.orderId,
						},
					});
				}
			}

			hasNextPage = data.orders.pageInfo.hasNextPage;
			after = data.orders.pageInfo.endCursor;
		}
	}
}
