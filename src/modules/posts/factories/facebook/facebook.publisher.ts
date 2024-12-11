import { JsonValue } from '@prisma/client/runtime/library';
import axios from 'axios';
import { PostData } from 'src/types/types';
import {
	PostPublisher,
	VideoMetadata,
} from '../common/post-factory/post.publisher.interface';
import * as ffmpeg from 'fluent-ffmpeg';
import { Readable, PassThrough } from 'stream';
import { FfprobeData } from 'fluent-ffmpeg';

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
				'Los campos "url" y "message" son requeridos en los datos de entrada.',
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
		let videoBuffer: Buffer;

		try {
			if (
				typeof fields !== 'object' ||
				!fields ||
				!('fileUrl' in fields)
			) {
				throw new Error(
					'El campo "fileUrl" es requerido en los datos de entrada.',
				);
			}

			const videoResponse = await axios.get(fields.fileUrl as string, {
				responseType: 'arraybuffer',
			});
			videoBuffer = Buffer.from(videoResponse.data);

			// Verificar si es un archivo MP4 válido
			// const signature = videoBuffer.toString('hex', 0, 8);
			// if (!this.isValidMP4(signature)) {
			// 	throw new Error('El archivo debe estar en formato MP4');
			// }

			// 2. Validar y ajustar el video si es necesario
			// const initialMetadata = await this.getVideoMetadata(videoBuffer);
			// if (
			// 	parseInt(initialMetadata.height) < 960 ||
			// 	parseInt(initialMetadata.width) !==
			// 		Math.floor(parseInt(initialMetadata.height) / 1.777778)
			// ) {
			// 	videoBuffer = await this.resizeVideo(videoBuffer);
			// }

			// 3. Validar metadata final
			// const videoMetadata = await this.getVideoMetadata(videoBuffer);
			// this.validateVideoSpecs(videoMetadata);

			const fileSize = videoBuffer.length;
			const startUrl = `${this.graphUrl}${accountId}/video_reels`;

			// 4. Iniciar la carga usando FormData
			const formData = new FormData();
			formData.append('access_token', token);
			formData.append('upload_phase', 'start');
			formData.append('file_size', fileSize.toString());

			const startResponse = await axios.post(startUrl, formData);
			const { video_id, upload_url } = startResponse.data;

			// 5. Subir el video usando las cabeceras específicas
			await axios.post(upload_url, videoBuffer, {
				headers: {
					Authorization: `OAuth ${token}`,
					file_size: fileSize.toString(),
					offset: '0',
					'Content-Type': 'application/octet-stream',
				},
			});

			// 6. Finalizar la publicación usando FormData
			const finishFormData = new FormData();
			finishFormData.append('access_token', token);
			finishFormData.append('upload_phase', 'finish');
			finishFormData.append('video_id', video_id);
			finishFormData.append('description', fields.description as string);
			finishFormData.append('video_state', 'PUBLISHED');

			await axios.post(startUrl, finishFormData);
		} catch (error) {
			let errorMessage = 'Error en la publicación del reel';
			if (axios.isAxiosError(error)) {
				errorMessage =
					error.response?.data?.error?.message || error.message;
			} else if (error instanceof Error) {
				errorMessage = error.message;
			}
			throw new Error(
				`Error en la publicación del reel: ${errorMessage}`,
			);
		}
	}

	private async resizeVideo(buffer: Buffer): Promise<Buffer> {
		return new Promise((resolve, reject) => {
			const inputStream = new Readable();
			inputStream.push(buffer);
			inputStream.push(null);

			const outputStream = new PassThrough();
			const outputBuffers: Buffer[] = [];

			outputStream.on('data', (chunk: Buffer) => {
				outputBuffers.push(chunk);
			});

			outputStream.on('end', () => {
				resolve(Buffer.concat(outputBuffers));
			});

			ffmpeg(inputStream)
				.size('1080x1920')
				.outputOptions([
					'-c:v libx264',
					'-preset medium',
					'-crf 23',
					'-movflags +faststart',
				])
				.toFormat('mp4')
				.on('error', reject)
				.pipe(outputStream);
		});
	}

	private isValidMP4(signature: string): boolean {
		const validSignatures = ['66747970', '667479703'];
		return validSignatures.some((sig) => signature.includes(sig));
	}

	private async getVideoMetadata(buffer: Buffer): Promise<VideoMetadata> {
		return new Promise((resolve, reject) => {
			const streamBuffer = new Readable();
			streamBuffer.push(buffer);
			streamBuffer.push(null);

			ffmpeg(streamBuffer).ffprobe(
				(err: Error, metadata: FfprobeData) => {
					if (err) {
						reject(
							new Error(
								`Error al obtener metadatos: ${err.message}`,
							),
						);
						return;
					}

					const videoStream = metadata.streams.find(
						(stream) => stream.codec_type === 'video',
					);
					const audioStream = metadata.streams.find(
						(stream) => stream.codec_type === 'audio',
					);

					if (!videoStream) {
						reject(new Error('No se encontró stream de video'));
						return;
					}

					const frameRate = eval(videoStream.r_frame_rate);

					resolve({
						width: (videoStream.width || 0).toString(),
						height: (videoStream.height || 0).toString(),
						duration: metadata.format.duration.toString(),
						frameRate: frameRate.toString(),
						audioCodec: audioStream?.codec_name || '',
						videoCodec: videoStream.codec_name,
					});
				},
			);
		});
	}

	private validateVideoSpecs(metadata: VideoMetadata) {
		const { width, height, duration, frameRate } = metadata;

		if (parseInt(width) < 540 || parseInt(height) < 960) {
			throw new Error('La resolución mínima debe ser 540x960 píxeles.');
		}

		const aspectRatio = parseInt(height) / parseInt(width);
		if (Math.abs(aspectRatio - 1.777778) > 0.1) {
			throw new Error('La relación de aspecto debe ser 9:16.');
		}

		if (parseFloat(duration) < 3 || parseFloat(duration) > 90) {
			throw new Error(
				'La duración del video debe estar entre 3 y 90 segundos.',
			);
		}

		if (parseFloat(frameRate) < 24 || parseFloat(frameRate) > 60) {
			throw new Error(
				'La velocidad de fotogramas debe estar entre 24 y 60 fps.',
			);
		}
	}
}
