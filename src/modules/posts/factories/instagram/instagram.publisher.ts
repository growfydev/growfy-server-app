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
			case 'photo':
				await this.createPhotoPost(data.accountId, data.token, fields);
				break;
			default:
				throw new NotFoundException('No se encontró el tipo de post');
		}
	}

	/**
	 * Publica una foto en Instagram mediante la API de Graph.
	 *
	 * @param accountId - ID de la cuenta de Instagram.
	 * @param token - Token de acceso para la API.
	 * @param fields - Datos de la publicación (image_url y caption).
	 *
	 * @throws {Error} Si faltan campos requeridos.
	 * @throws {BadRequestException} Si ocurre un error en los pasos de publicación.
	 *
	 * @private
	 */
	private async createPhotoPost(
		accountId: string,
		token: string,
		fields: JsonValue,
	): Promise<void> {
		const { image_url, caption } = this.validateFields(fields);

		const creationId = await this.createMediaContainer(accountId, token, {
			image_url,
			caption,
		});
		await this.publishMediaContainer(accountId, token, creationId);
	}

	/**
	 * Valida los campos necesarios para crear una publicación de foto y extrae los valores requeridos.
	 *
	 * @param fields - Datos de la publicación.
	 * @returns Los valores de image_url y caption extraídos.
	 * @throws {Error} Si faltan campos requeridos.
	 * @private
	 */
	private validateFields(fields: JsonValue): PhotoFields {
		if (
			typeof fields !== 'object' ||
			!fields ||
			!('image_url' in fields) ||
			!('caption' in fields)
		) {
			throw new Error(
				'El campo "image_url" es requerido en los datos de entrada.',
			);
		}

		return {
			image_url: fields.image_url as string,
			caption: fields.caption as string,
		};
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
