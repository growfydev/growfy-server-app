import { JsonValue } from '@prisma/client/runtime/library';
import { PostData } from 'src/types/types';
import axios from 'axios';
import { PostPublisher } from '../common/post-factory/post.publisher.interface';
import { BadRequestException, NotFoundException } from '@nestjs/common';

export class InstagramPublisher implements PostPublisher {
	private readonly graphUrl = 'https://graph.instagram.com/v21.0/';
	async publish(
		typePostName: string,
		fields: JsonValue,
		data: PostData,
	): Promise<void> {
		if (!fields) {
			throw new Error(
				'El campo "fields" es requerido en los datos de entrada.',
			);
		}

		switch (typePostName) {
			case 'image':
				await this.createInstagramPost(
					data.accountId,
					data.token,
					fields,
				);
				break;
			case 'short_video':
				await this.createAndPublishReel(
					data.accountId,
					data.token,
					fields,
				);
				break;
			default:
				throw new NotFoundException('No se encontró el tipo de post');
		}
	}

	/**
	 * Crea y publica un reel en Instagram.
	 *
	 * @param accountId - ID de la cuenta de Instagram.
	 * @param token - Token de acceso para la API.
	 * @param fields - Datos del reel a publicar (JsonValue).
	 * @returns {Promise<boolean>} Indica si la creación y publicación fue exitosa.
	 * @throws {BadRequestException} Si ocurre un error al crear o publicar el reel.
	 */
	private async createAndPublishReel(
		accountId: string,
		token: string,
		fields: JsonValue,
	): Promise<boolean> {
		try {
			if (
				typeof fields !== 'object' ||
				!fields ||
				!('video_url' in fields)
			) {
				throw new Error(
					'El campo "video_url" es requerido en los datos de entrada.',
				);
			}

			const createUrl = `${this.graphUrl}${accountId}/media`;
			const payload = {
				media_type: 'REELS',
				video_url: (fields as Record<string, JsonValue>).video_url,
				caption: (fields as Record<string, JsonValue>).caption || '',
				share_to_feed: false,
				access_token: token,
			};

			const createResponse = await axios.post(createUrl, payload);
			const creationId = createResponse.data.id;
			const published = await this.publishReelWithRetries(
				accountId,
				token,
				creationId,
			);
			return published;
		} catch (error) {
			throw new BadRequestException(
				`Error al crear el reel: ${error.message}`,
			);
		}
	}

	/**
	 * Publica un reel en Instagram.
	 *
	 * @param accountId - ID de la cuenta de Instagram.
	 * @param token - Token de acceso para la API.
	 * @param creationId - ID del reel a publicar.
	 * @returns {Promise<boolean>} Indica si la publicación fue exitosa.
	 * @throws {BadRequestException} Si ocurre un error al publicar el reel.
	 */
	private async publishReelWithRetries(
		accountId: string,
		token: string,
		creationId: string,
	): Promise<boolean> {
		const maxRetries = 5;
		let attempt = 0;
		let published = false;

		while (attempt < maxRetries && !published) {
			try {
				await delay(5000); // Espera 5 segundos
				published = await this.publishReel(
					accountId,
					token,
					creationId,
				);
			} catch (error) {
				attempt++;
				if (attempt >= maxRetries) {
					throw new Error(
						'Error en la publicación del reel después de varios intentos.',
					);
				}
				console.error('Intento fallido de publicación:', error);
			}
		}
		return published;
	}

	/**
	 * Publica un reel en Instagram.
	 *
	 * @param accountId - ID de la cuenta de Instagram.
	 * @param token - Token de acceso para la API.
	 * @param creationId - ID del reel a publicar.
	 * @returns {Promise<boolean>} Indica si la publicación fue exitosa.
	 * @throws {BadRequestException} Si ocurre un error al publicar el reel.
	 */
	private async publishReel(
		accountId: string,
		token: string,
		creationId: string,
	): Promise<boolean> {
		const publishUrl = `${this.graphUrl}${accountId}/media_publish`;
		const publishPayload = {
			creation_id: creationId,
			access_token: token,
		};

		try {
			const publishResponse = await axios.post(
				publishUrl,
				publishPayload,
			);
			console.log('Publicación exitosa:', publishResponse.data);
			return true;
		} catch (error) {
			throw new BadRequestException(
				`Error al publicar el reel: ${error.message}`,
			);
		}
	}

	/**
	 * Publica una foto o un carrusel en Instagram mediante la API de Graph.
	 *
	 * @param accountId - ID de la cuenta de Instagram.
	 * @param token - Token de acceso para la API.
	 * @param fields - Datos de la publicación ({ image_url, caption } como JsonValue).
	 *
	 * @throws {Error} Si faltan campos requeridos o el contenido no es válido.
	 * @throws {BadRequestException} Si ocurre un error en los pasos de publicación.
	 */
	private async createInstagramPost(
		accountId: string,
		token: string,
		fields: JsonValue,
	): Promise<void> {
		// Validar y extraer los campos necesarios del parámetro `fields`
		const { image_urls, caption } = this.validateFields(fields);

		// Asegurarse de que image_urls es un arreglo
		if (!Array.isArray(image_urls) || image_urls.length === 0) {
			throw new Error('Debe proporcionar al menos una imagen.');
		}

		// Publicación de foto única
		if (image_urls.length === 1) {
			const creationId = await this.createMediaContainer(
				accountId,
				token,
				{
					image_url: [image_urls[0]],
					caption, // Caption único para la foto
				},
			);
			await this.publishMediaContainer(accountId, token, creationId);
			return;
		}

		// Publicación de carrusel
		if (image_urls.length > 1) {
			const mediaContainerIds: string[] = [];

			// Crear contenedores individuales para las imágenes del carrusel
			for (const imageUrl of image_urls) {
				const creationId = await this.createMediaContainer(
					accountId,
					token,
					{ image_url: [imageUrl], caption: '' }, // Sin caption aquí
				);
				mediaContainerIds.push(creationId);
			}

			// Crear contenedor del carrusel con el caption único
			const carouselContainerId = await this.createCarouselContainer(
				accountId,
				token,
				mediaContainerIds,
				caption, // Caption único para el carrusel
			);

			// Publicar el contenedor del carrusel
			await this.publishMediaContainer(
				accountId,
				token,
				carouselContainerId,
			);
		}
	}

	/**
	 * Valida los campos proporcionados en el parámetro `fields`.
	 *
	 * @param fields - Datos de la publicación a validar (JsonValue).
	 * @returns { image_url: string, caption: string }
	 * @throws {Error} Si faltan campos requeridos o el formato es inválido.
	 */
	private validateFields(fields: JsonValue): {
		image_urls: string[];
		caption: string;
	} {
		if (typeof fields !== 'object' || fields === null) {
			throw new Error('El parámetro "fields" debe ser un objeto.');
		}

		const image_urls = (fields as Record<string, JsonValue>)
			.image_url as string[];
		const caption = (fields as Record<string, JsonValue>).caption as string;

		if (!Array.isArray(image_urls) || image_urls.length === 0) {
			throw new Error(
				'El campo "image_url" es obligatorio y debe ser un arreglo.',
			);
		}

		if (typeof caption !== 'string') {
			throw new Error('El campo "caption" debe ser una cadena de texto.');
		}

		return { image_urls, caption };
	}

	/**
	 * Crea un contenedor de medios en Instagram.
	 *
	 * @param accountId - ID de la cuenta de Instagram.
	 * @param token - Token de acceso para la API.
	 * @param image_url - URL de la imagen.
	 * @param caption - Subtítulo de la publicación.
	 * @returns El ID del contenedor creado.
	 * @throws {BadRequestException} Si ocurre un error al crear el contenedor.
	 * @private
	 */
	private async createMediaContainer(
		accountId: string,
		token: string,
		fields: { image_url: string[]; caption: string },
	): Promise<string> {
		const createUrl = `${this.graphUrl}${accountId}/media`;
		const payload = {
			image_url: fields.image_url[0],
			caption: fields.caption,
			media_type: 'IMAGE',
			access_token: token,
		};

		try {
			const response = await axios.post(createUrl, payload);
			return response.data.id; // ID del contenedor creado
		} catch (error) {
			throw new BadRequestException(
				`Error al crear el contenedor: ${error.response?.data?.error?.message || error.message}`,
			);
		}
	}

	/**
	 * Crea un contenedor de carrusel en Instagram.
	 *
	 * @param accountId - ID de la cuenta de Instagram.
	 * @param token - Token de acceso para la API.
	 * @param mediaContainerIds - IDs de los contenedores de medios individuales.
	 * @returns El ID del contenedor de carrusel creado.
	 * @throws {BadRequestException} Si ocurre un error al crear el contenedor.
	 * @private
	 */
	private async createCarouselContainer(
		accountId: string,
		token: string,
		mediaContainerIds: string[],
		caption: string,
	): Promise<string> {
		const createUrl = `${this.graphUrl}${accountId}/media`;
		const payload = {
			media_type: 'CAROUSEL',
			children: mediaContainerIds,
			caption, // Caption único para el carrusel
			access_token: token,
		};

		try {
			const response = await axios.post(createUrl, payload);
			return response.data.id; // ID del contenedor de carrusel creado
		} catch (error) {
			throw new BadRequestException(
				`Error al crear el contenedor de carrusel: ${error.response?.data?.error?.message || error.message}`,
			);
		}
	}

	/**
	 * Publica un contenedor de medios en Instagram.
	 *
	 * @param accountId - ID de la cuenta de Instagram.
	 * @param token - Token de acceso para la API.
	 * @param creationId - ID del contenedor a publicar.
	 * @throws {BadRequestException} Si ocurre un error al publicar el contenedor.
	 * @private
	 */
	private async publishMediaContainer(
		accountId: string,
		token: string,
		creationId: string,
	): Promise<void> {
		const publishUrl = `${this.graphUrl}${accountId}/media_publish`;
		const payload = {
			creation_id: creationId,
			access_token: token,
		};

		try {
			await axios.post(publishUrl, payload);
		} catch (error) {
			throw new BadRequestException(
				`Error al publicar el contenedor: ${error.response?.data?.error?.message || error.message}`,
			);
		}
	}
}

function delay(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
