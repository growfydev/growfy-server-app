import { JsonValue } from '@prisma/client/runtime/library';
import axios from 'axios';
import { PostData } from 'src/types/types';
import {
	PostPublisher,
	VideoMetadata,
} from '../common/post-factory/post.publisher.interface';

export class FacebookPublisher implements PostPublisher {
	private readonly graphUrl = 'https://graph.facebook.com/v21.0/';

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
			case 'message':
				await this.createMessagePost(
					data.accountId,
					data.token,
					fields,
				);
				break;
			case 'image':
				await this.createPhotoPost(data.accountId, data.token, fields);
				break;
			case 'reel':
				await this.createReelPost(data.accountId, data.token, fields);
				break;
			default:
				throw new Error('No se encontró el tipo de post');
		}
	}

	private async createMessagePost(
		accountId: string,
		token: string,
		fields: JsonValue,
	): Promise<void> {
		if (typeof fields !== 'object' || !fields || !('message' in fields)) {
			throw new Error(
				'El campo "message" es requerido en los datos de entrada.',
			);
		}
		const url = `${this.graphUrl}${accountId}/feed`;
		const payload = {
			message: fields.message,
			access_token: token,
		};

		try {
			await axios.post(url, payload);
		} catch (error) {
			throw new Error(
				`Error al realizar la publicación: ${error.response?.data?.error?.message || error.message}`,
			);
		}
	}

	private async createPhotoPost(
		accountId: string,
		token: string,
		fields: JsonValue,
	): Promise<void> {
		if (
			typeof fields !== 'object' ||
			!fields ||
			!('url' in fields) ||
			!('message' in fields)
		) {
			throw new Error(
				'El campo "url" es requerido en los datos de entrada.',
			);
		}
		const url = `${this.graphUrl}${accountId}/photos`;
		const payload = {
			url: fields.url,
			message: fields.message,
			access_token: token,
		};

		try {
			await axios.post(url, payload);
		} catch (error) {
			throw new Error(
				`Error al realizar la publicación: ${error.response?.data?.error?.message || error.message}`,
			);
		}
	}

	private async createReelPost(
		accountId: string,
		token: string,
		fields: JsonValue,
	): Promise<void> {
		if (
			typeof fields !== 'object' ||
			!fields ||
			!('description' in fields) ||
			(!('fileUrl' in fields) && !('fileData' in fields))
		) {
			throw new Error(
				'Se requiere "description" y una fuente de video (fileUrl o fileData)',
			);
		}

		const startUrl = `${this.graphUrl}${accountId}/video_reels`;
		let uploadSessionId: string;
		let videoBuffer: Buffer;

		try {
			// Obtener el video según la fuente
			if ('fileUrl' in fields) {
				// Si es una URL
				const videoResponse = await axios.get(
					fields.fileUrl as string,
					{
						responseType: 'arraybuffer',
						headers: {
							Range: 'bytes=0-1024000',
						},
					},
				);
				videoBuffer = Buffer.from(videoResponse.data);
			} else if ('fileData' in fields) {
				// Si es un archivo local
				if (Buffer.isBuffer(fields.fileData)) {
					videoBuffer = fields.fileData;
				} else if (typeof fields.fileData === 'string') {
					// Si es base64
					videoBuffer = Buffer.from(fields.fileData, 'base64');
				} else {
					throw new Error('Formato de archivo no válido');
				}
			}

			// Validar el tipo de archivo
			const fileSignature = videoBuffer.slice(0, 4).toString('hex');
			if (!this.isValidMP4(fileSignature)) {
				throw new Error('El archivo debe estar en formato MP4.');
			}

			// Obtener y validar metadata
			const videoMetadata = await this.getVideoMetadata(videoBuffer);
			this.validateVideoSpecs(videoMetadata);

			const fileSize = videoBuffer.length;

			// Paso 1: Inicio de la subida
			const startResponse = await axios.post(startUrl, {
				upload_phase: 'start',
				access_token: token,
				file_size: fileSize,
			});
			uploadSessionId = startResponse.data.upload_session_id;

			// Paso 2: Transferencia del archivo
			const chunkSize = 1024 * 1024; // 1MB por chunk
			for (let start = 0; start < fileSize; start += chunkSize) {
				const chunk = videoBuffer.slice(
					start,
					Math.min(start + chunkSize, fileSize),
				);
				await axios.post(startUrl, {
					upload_phase: 'transfer',
					upload_session_id: uploadSessionId,
					video_file_chunk: chunk,
					start_offset: start,
					access_token: token,
				});
			}

			// Paso 3: Finalización de la subida
			await axios.post(startUrl, {
				upload_phase: 'finish',
				upload_session_id: uploadSessionId,
				description: fields.description,
				title: fields.title || fields.description,
				access_token: token,
			});
		} catch (error) {
			throw new Error(
				`Error en la publicación del reel: ${error.response?.data?.error?.message || error.message}`,
			);
		}
	}

	private isValidMP4(signature: string): boolean {
		const validSignatures = ['66747970', '667479703'];
		return validSignatures.some((sig) => signature.includes(sig));
	}

	private async getVideoMetadata(buffer: Buffer): Promise<VideoMetadata> {
		return new Promise((resolve, reject) => {
			const ffmpeg = require('fluent-ffmpeg');
			const { Readable } = require('stream');
			const streamBuffer = new Readable();
			streamBuffer.push(buffer);
			streamBuffer.push(null);

			ffmpeg(streamBuffer).ffprobe((err: any, metadata: any) => {
				if (err) {
					reject(
						new Error(`Error al obtener metadatos: ${err.message}`),
					);
					return;
				}

				const videoStream = metadata.streams.find(
					(stream: any) => stream.codec_type === 'video',
				);
				const audioStream = metadata.streams.find(
					(stream: any) => stream.codec_type === 'audio',
				);

				if (!videoStream) {
					reject(new Error('No se encontró stream de video'));
					return;
				}

				const frameRate = eval(videoStream.r_frame_rate);

				resolve({
					width: videoStream.width,
					height: videoStream.height,
					duration: parseFloat(metadata.format.duration),
					frameRate: frameRate,
					audioCodec: audioStream?.codec_name || '',
					videoCodec: videoStream.codec_name,
				});
			});
		});
	}

	private validateVideoSpecs(metadata: VideoMetadata) {
		const { width, height, duration, frameRate } = metadata;

		if (width < 540 || height < 960) {
			throw new Error('La resolución mínima debe ser 540x960 píxeles.');
		}

		const aspectRatio = height / width;
		if (Math.abs(aspectRatio - 1.777778) > 0.1) {
			throw new Error('La relación de aspecto debe ser 9:16.');
		}

		if (duration < 3 || duration > 90) {
			throw new Error(
				'La duración del video debe estar entre 3 y 90 segundos.',
			);
		}

		if (frameRate < 24 || frameRate > 60) {
			throw new Error(
				'La velocidad de fotogramas debe estar entre 24 y 60 fps.',
			);
		}
	}
}
