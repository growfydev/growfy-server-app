import { JsonValue } from '@prisma/client/runtime/library';
import { PostValidationProperties } from '../common/post-factory/post.validationProperties.interface';
import axios from 'axios';
import imageSize from 'image-size';
import { getVideoDurationInSeconds } from 'get-video-duration';
import { Readable } from 'stream';
import { Injectable } from '@nestjs/common';
import { fromBuffer } from 'file-type';

@Injectable()
export class InstagramValidationProperties implements PostValidationProperties {
	async validation(
		typePostName: string,
		fields: JsonValue,
		properties: JsonValue,
	): Promise<void> {
		if (!fields) {
			throw new Error(
				'El campo "fields" es requerido en los datos de entrada para Instagram.',
			);
		}
		switch (typePostName) {
			case 'image':
				await this.validateImageProperties(fields, properties);
				break;
			case 'short_video':
				await this.validateReelProperties(fields, properties);
				break;
			default:
				throw new Error(
					'Tipo de publicación no soportado en Instagram.',
				);
		}
	}

	private async validateImageProperties(
		fields: JsonValue,
		properties: JsonValue,
	): Promise<void> {
		if (typeof fields !== 'object' || fields === null) {
			throw new Error(
				'El parámetro "fields y properties" deben ser un objeto para Instagram.',
			);
		}

		const images = (fields as Record<string, JsonValue>)
			.image_url as string[];
		const validationProperties = properties as {
			validFormats: string[];
			maxSize: number;
			minDimensions: { width: number; height: number };
		};

		if (!Array.isArray(images) || images.length === 0) {
			throw new Error(
				'Debe proporcionarse al menos una URL de imagen para Instagram.',
			);
		}

		if (!validationProperties) {
			throw new Error(
				'No se encontraron propiedades de validación para el tipo de publicación en Instagram.',
			);
		}

		const { validFormats, maxSize, minDimensions } = validationProperties;

		for (const image of images) {
			const response = await axios.get(image, {
				responseType: 'arraybuffer',
			});
			const buffer = Buffer.from(response.data);

			// Validar tamaño del archivo
			if (buffer.length > maxSize) {
				throw new Error(
					`El tamaño del archivo ${buffer.length} es mayor al máximo permitido en Instagram. El tamaño máximo permitido es de ` +
						maxSize +
						' bytes.',
				);
			}

			// Usar `file-type` para analizar formato
			const type = await fromBuffer(buffer);

			if (!type || !validFormats.includes(type.mime)) {
				throw new Error(
					`El formato del archivo "${type.mime}" no es válido o no soportado en Instagram. Los formatos permitidos son: ` +
						validFormats.join(', '),
				);
			}

			// Usar `image-size` para analizar dimensiones
			const dimensions = imageSize(buffer);
			if (
				dimensions.width < minDimensions.width ||
				dimensions.height < minDimensions.height
			) {
				throw new Error(
					`Las dimensiones ancho: "${dimensions.width}" y alto: "${dimensions.height}" de la imagen no cumplen con los mínimos requeridos en Instagram. Las dimensiones mínimas permitidas son ` +
						minDimensions.width +
						'x' +
						minDimensions.height +
						' píxeles.',
				);
			}
		}
	}

	private async validateReelProperties(
		fields: JsonValue,
		properties: JsonValue,
	): Promise<void> {
		if (typeof fields !== 'object' || fields === null) {
			throw new Error(
				'El parámetro "fields" debe ser un objeto para Instagram.',
			);
		}

		const videoUrl = (fields as Record<string, JsonValue>)
			.video_url as string;

		if (typeof videoUrl !== 'string' || videoUrl.trim() === '') {
			throw new Error(
				'Debe proporcionarse una URL válida del video para Instagram.',
			);
		}

		const validationProperties = properties as {
			validFormats: string[];
			maxSize: number;
			minDuration: number;
			maxDuration: number;
		};

		if (!validationProperties) {
			throw new Error(
				'No se encontraron propiedades de validación para el tipo de publicación en Instagram.',
			);
		}

		const { validFormats, maxSize, minDuration, maxDuration } =
			validationProperties;

		const response = await axios.get(videoUrl, {
			responseType: 'arraybuffer',
		});
		const buffer = Buffer.from(response.data);

		const size = buffer.length;
		if (size > maxSize) {
			throw new Error(
				`El tamaño del archivo ${size} es mayor al máximo permitido en Instagram. El tamaño máximo permitido es de ` +
					maxSize +
					' bytes.',
			);
		}

		const bufferStream = new Readable();
		bufferStream.push(buffer);
		bufferStream.push(null);

		const duration = await getVideoDurationInSeconds(bufferStream);
		if (duration < minDuration || duration > maxDuration) {
			throw new Error(
				`La duración del video ${duration} segundos no cumple con los límites permitidos en Instagram. La duración mínima permitida es de ${minDuration} segundos y la duración máxima permitida es de ${maxDuration} segundos.`,
			);
		}

		// Usar `file-type` para validar el formato
		const type = await fromBuffer(buffer);

		if (!type || !validFormats.includes(type.mime)) {
			throw new Error(
				`El formato del archivo "${type.mime}" no es válido o no soportado en Instagram. Los formatos permitidos son: ` +
					validFormats.join(', '),
			);
		}
	}
}
