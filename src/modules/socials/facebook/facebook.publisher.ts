import axios from 'axios';
import { PostPublisher } from '../common/post-factory/post.publisher.interface';
import { JsonObject } from '@prisma/client/runtime/library';

export class FacebookPublisher implements PostPublisher {
  private readonly graphUrl = 'https://graph.facebook.com/v21.0/';

  async publish(
    typePostName: string,
    fields: JsonObject,
    data: any,
  ): Promise<void> {
    if (!fields) {
      throw new Error(
        'El campo "fields" es requerido en los datos de entrada.',
      );
    }

    switch (typePostName) {
      case 'message':
        await this.createMessagePost(data.accountId, data.token, fields);
        break;

      default:
        throw new Error('No se encontró el tipo de post');
    }
  }

  private async createMessagePost(
    accountId: string,
    token: string,
    fields: JsonObject,
  ): Promise<void> {
    if (!fields.message) {
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
    } catch (error: any) {
      throw new Error(
        `Error al realizar la publicación: ${error.response?.data?.error?.message || error.message}`,
      );
    }
  }
}
