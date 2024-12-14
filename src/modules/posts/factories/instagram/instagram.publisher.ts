import { JsonValue } from '@prisma/client/runtime/library';
import { PostData } from 'src/types/types';
import axios from 'axios';
import {
	PhotoFields,
	PostPublisher,
} from '../common/post-factory/post.publisher.interface';
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
			default:
				throw new NotFoundException('No se encontró el tipo de post');
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
		const { image_url, caption } = this.validateFields(fields);

		// Separar URLs de imágenes en una lista
		const imageUrls = image_url.split(',').map((url) => url.trim());

		if (imageUrls.length === 0) {
			throw new Error('Debe proporcionar al menos una imagen.');
		}

		// Publicación de foto única
		if (imageUrls.length === 1) {
			const creationId = await this.createMediaContainer(
				accountId,
				token,
				{
					image_url: imageUrls[0],
					caption, // Caption único para la foto
				},
			);
			await this.publishMediaContainer(accountId, token, creationId);
			return;
		}

		// Publicación de carrusel
		if (imageUrls.length > 1) {
			const mediaContainerIds: string[] = [];

			// Crear contenedores individuales para las imágenes del carrusel
			for (const imageUrl of imageUrls) {
				const creationId = await this.createMediaContainer(
					accountId,
					token,
					{ image_url: imageUrl, caption: '' }, // Sin caption aquí
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
	private validateFields(fields: JsonValue): PhotoFields {
		if (typeof fields !== 'object' || fields === null) {
			throw new Error('El parámetro "fields" debe ser un objeto.');
		}

		const image_url = (fields as Record<string, JsonValue>)
			.image_url as string;
		const caption = (fields as Record<string, JsonValue>).caption as string;

		if (!image_url) {
			throw new Error('El campo "image_url" es obligatorio.');
		}

		if (typeof image_url !== 'string' || typeof caption !== 'string') {
			throw new Error(
				'Los campos "image_url" y "caption" deben ser cadenas de texto.',
			);
		}

		return { image_url, caption };
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
		fields: PhotoFields,
	): Promise<string> {
		const createUrl = `${this.graphUrl}${accountId}/media`;
		const payload = {
			...fields,
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
