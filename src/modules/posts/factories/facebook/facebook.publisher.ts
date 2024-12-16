import { JsonValue } from '@prisma/client/runtime/library';
import axios from 'axios';
import { PostData } from 'src/types/types';
import { PostPublisher } from '../common/post-factory/post.publisher.interface';

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
			case 'short_video':
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
}
