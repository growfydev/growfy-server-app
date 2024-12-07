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
}
