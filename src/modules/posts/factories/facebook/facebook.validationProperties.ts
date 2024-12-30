import { JsonValue } from '@prisma/client/runtime/library';
import {
	PostValidationProperties,
	VideoValidationProperties,
} from '../common/post-factory/post.validationProperties.interface';
import axios from 'axios';
import imageSize from 'image-size';
import { fromBuffer } from 'file-type';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
ffmpeg.setFfmpegPath(ffmpegStatic);
import { PassThrough } from 'stream';

export class FacebookValidationProperties implements PostValidationProperties {
	async validation(
		typePostName: string,
		fields: JsonValue,
		properties: JsonValue,
	): Promise<void> {
		if (!fields) {
			throw new Error(
				'El campo "fields" es requerido en los datos de entrada.',
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
				throw new Error('Tipo de publicación no soportado.');
		}
	}

	private async validateImageProperties(
		fields: JsonValue,
		properties: JsonValue,
	): Promise<void> {
		if (typeof fields !== 'object' || fields === null) {
			throw new Error(
				'El parámetro "fields y properties" deben ser un objeto.',
			);
		}
		const image = (fields as Record<string, JsonValue>).url as string;

		if (!image) {
			throw new Error('Debe proporcionarse una URL de imagen.');
		}

		const validationProperties = properties as {
			validFormats: string[];
			maxSize: number;
			aspectRatio: number;
			minDimensions: { width: number; height: number };
		};

		if (!validationProperties) {
			throw new Error(
				'No se encontraron propiedades de validación para el tipo de publicación.',
			);
		}

		const { validFormats, maxSize, minDimensions, aspectRatio } =
			validationProperties;

		const response = await axios.get(image, {
			responseType: 'arraybuffer',
		});

		const buffer = Buffer.from(response.data);

		if (buffer.length > maxSize) {
			throw new Error(
				`El tamaño del archivo ${buffer.length} es mayor al máximo permitido. El tamaño máximo permitido es de ` +
					maxSize +
					' bytes.',
			);
		}

		const type = await fromBuffer(buffer);

		if (!type || !validFormats.includes(type.mime)) {
			throw new Error(
				`El formato del archivo "${type.mime}" no es válido o no soportado. Los formatos permitidos son: ` +
					validFormats.join(', '),
			);
		}

		const dimensions = imageSize(buffer);

		if (
			dimensions.width < minDimensions.width ||
			dimensions.height < minDimensions.height
		) {
			throw new Error(
				`Las dimensiones de la imagen ${dimensions.width}x${dimensions.height} no cumplen con las dimensiones mínimas requeridas de ${minDimensions.width}x${minDimensions.height}.`,
			);
		}

		const actualAspectRatio = dimensions.width / dimensions.height;

		if (Math.abs(actualAspectRatio - aspectRatio) > 0.01) {
			throw new Error(
				`La relación de aspecto de la imagen (${actualAspectRatio.toFixed(
					2,
				)}) no es la recomendada de ${aspectRatio}`,
			);
		}
	}

	private async validateReelProperties(
		fields: JsonValue,
		properties: JsonValue,
	): Promise<void> {
		if (typeof fields !== 'object' || fields === null) {
			throw new Error(
				'El parámetro "fields y properties" deben ser un objeto.',
			);
		}
		const video = (fields as Record<string, JsonValue>).fileUrl as string;

		if (!video) {
			throw new Error('Debe proporcionarse una URL de video.');
		}

		const validationProperties = properties as {
			validFormats: string[];
			maxSize: number;
			minDimensions: { width: number; height: number };
			maxDimensions: { width: number; height: number };
			minDuration: number;
			maxDuration: number;
			frameRateRange: { min: number; max: number };
			audioBitrateMin: number;
			audioSampleRate: number;
			aspectRatio: string;
			videoCodec: string[];
			audioCodec: string;
			chromaSubsampling: string;
			scanType: string;
			gopType: string;
			gopLengthRange: { min: number; max: number };
		};

		if (!validationProperties) {
			throw new Error(
				'No se encontraron propiedades de validación para el tipo de publicación.',
			);
		}

		const response = await axios.get(video, {
			responseType: 'arraybuffer',
		});

		const buffer = Buffer.from(response.data);

		if (buffer.length > validationProperties.maxSize) {
			throw new Error(
				`El tamaño ${buffer.length} del video  excede el máximo permitido. El tamaño máximo permitido es de ` +
					validationProperties.maxSize +
					' bytes.',
			);
		}

		await this.validateVideoWithFFmpeg(buffer, validationProperties);
	}

	private async validateVideoWithFFmpeg(
		buffer: Buffer,
		properties: VideoValidationProperties,
	): Promise<void> {
		return new Promise((resolve, reject) => {
			const inputStream = new PassThrough();
			inputStream.end(buffer);

			ffmpeg(inputStream).ffprobe((err, metadata) => {
				if (err) {
					return reject(err);
				}

				const videoStream = metadata.streams.find(
					(stream) => stream.codec_type === 'video',
				);
				const audioStream = metadata.streams.find(
					(stream) => stream.codec_type === 'audio',
				);

				if (!videoStream) {
					return reject(
						new Error('No se encontró un stream de video.'),
					);
				}

				if (!audioStream) {
					return reject(
						new Error('No se encontró un stream de audio.'),
					);
				}

				const {
					width,
					height,
					codec_name,
					r_frame_rate,
					duration,
					pix_fmt,
					field_order,
					nb_frames,
				} = videoStream;
				const [num, den] = r_frame_rate.split('/').map(Number);
				const frameRate = num / den;

				// Validar dimensiones
				if (
					width < properties.minDimensions.width ||
					height < properties.minDimensions.height
				) {
					return reject(
						new Error(
							`Las dimensiones ${width} x ${height} del video son menores que las mínimas permitidas. Las dimensiones permitidas son ${properties.minDimensions.width} x ${properties.minDimensions.height}.`,
						),
					);
				}

				if (
					width > properties.maxDimensions.width ||
					height > properties.maxDimensions.height
				) {
					return reject(
						new Error(
							`Las dimensiones ${width} x ${height} del video son mayores que las máximas permitidas. Las dimensiones permitidas son ${properties.maxDimensions.width} x ${properties.maxDimensions.height}.`,
						),
					);
				}

				// Validar duración
				if (
					Number(duration) < properties.minDuration ||
					Number(duration) > properties.maxDuration
				) {
					return reject(
						new Error(
							`La duración ${duration} del video está fuera del rango permitido. La duración permitida es de ${properties.minDuration} a ${properties.maxDuration} segundos.`,
						),
					);
				}

				// Validar frame rate
				if (
					frameRate < properties.frameRateRange.min ||
					frameRate > properties.frameRateRange.max
				) {
					return reject(
						new Error(
							`El frame rate ${frameRate} del video está fuera del rango permitido. El frame rate permitido es de ${properties.frameRateRange.min} a ${properties.frameRateRange.max} fps.`,
						),
					);
				}

				// Validar bitrate de audio
				if (Number(audioStream.bit_rate) < properties.audioBitrateMin) {
					return reject(
						new Error(
							`El bitrate de audio ${audioStream.bit_rate} es menor que el mínimo permitido. El bitrate actual es ${audioStream.bit_rate}.`,
						),
					);
				}

				// Validar sample rate de audio
				if (audioStream.sample_rate !== properties.audioSampleRate) {
					return reject(
						new Error(
							`El sample rate de audio ${audioStream.sample_rate} no coincide con el permitido. El sample permitido es ${properties.audioSampleRate}.`,
						),
					);
				}

				// Validar códec de video
				if (!properties.videoCodec.includes(codec_name)) {
					return reject(
						new Error(
							`El códec ${codec_name} de video no es válido. El códec permitido es ${properties.videoCodec}.`,
						),
					);
				}

				// Validar códec de audio
				if (audioStream.codec_name !== properties.audioCodec) {
					return reject(
						new Error(
							`El códec ${audioStream.codec_name} de audio no es válido. El códec permitido es ${properties.audioCodec}.`,
						),
					);
				}

				// Validar aspect ratio
				const aspectRatio = `${width}:${height}`;
				if (aspectRatio !== properties.aspectRatio) {
					return reject(
						new Error(
							`El aspect ratio ${aspectRatio} del video no es válido. El aspect ratio permitido es ${properties.aspectRatio}.`,
						),
					);
				}

				// Validar chroma subsampling
				if (pix_fmt !== properties.chromaSubsampling) {
					return reject(
						new Error(
							`El chroma subsampling ${pix_fmt} del video no es válido. El chroma subsampling permitido es ${properties.chromaSubsampling}.`,
						),
					);
				}

				// Validar scan type
				if (field_order !== properties.scanType) {
					return reject(
						new Error(
							`El scan type ${field_order} del video no es válido. El scan type permitido es ${properties.scanType}.`,
						),
					);
				}

				// Validar GOP type y length
				const gopLength = Number(duration) / Number(nb_frames);
				if (
					gopLength < properties.gopLengthRange.min ||
					gopLength > properties.gopLengthRange.max
				) {
					return reject(
						new Error(
							`La longitud del GOP ${gopLength} está fuera del rango permitido. El rango permitido es de ${properties.gopLengthRange.min} a ${properties.gopLengthRange.max}.`,
						),
					);
				}

				resolve();
			});
		});
	}
}
