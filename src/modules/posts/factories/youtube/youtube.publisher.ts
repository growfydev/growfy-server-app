import { JsonValue } from '@prisma/client/runtime/library';
import { OAuth2Client } from 'google-auth-library';
import { google, youtube_v3 } from 'googleapis';
import { Readable } from 'stream';

// Tipos más específicos para mayor seguridad
interface PostData {
  accountId: string;
  token: string;
  file: Buffer | Readable;
  fileType?: string;
}

interface YoutubeFields {
  title: string;
  description?: string;
  tags?: string[];
  privacyStatus?: 'private' | 'public' | 'unlisted';
}

interface PostPublisher {
  publish(
    typePostName: string, 
    fields: JsonValue, 
    data: PostData
  ): Promise<string | void>;
}

export class YoutubePublisher implements PostPublisher {
  private youtube: youtube_v3.Youtube;

  constructor(
    private oauth2Client: OAuth2Client
  ) {}

  async publish(
    typePostName: string,
    fields: JsonValue,
    data: PostData
  ): Promise<string> {
    // Validaciones de entrada más estrictas
    if (!fields || typeof fields !== 'object') {
      throw new TypeError('Campos de publicación inválidos');
    }

    if (!data.token) {
      throw new Error('Token de autenticación requerido');
    }

    try {
      // Parseo seguro del token
      const credentials = JSON.parse(data.token);
      this.oauth2Client.setCredentials(credentials);

      // Inicialización segura de YouTube
      this.youtube = google.youtube({ 
        version: 'v3', 
        auth: this.oauth2Client 
      });

      switch (typePostName) {
        case 'video':
          return await this.uploadVideo(data, fields as unknown as YoutubeFields);
        case 'short':
          return await this.uploadShort(data, fields as unknown as YoutubeFields);
        default:
          throw new Error('Tipo de publicación no soportado');
      }
    } catch (parseError) {
      throw new Error(`Error de autenticación: ${parseError.message}`);
    }
  }

  private async uploadVideo(
    data: PostData,
    fields: YoutubeFields
  ): Promise<string> {
    this.validateFields(fields);

    try {
      const response = await this.youtube.videos.insert({
        part: ['snippet', 'status'],
        requestBody: {
          snippet: {
            title: fields.title,
            description: fields.description || '',
            tags: this.sanitizeTags(fields.tags)
          },
          status: {
            privacyStatus: fields.privacyStatus || 'private'
          }
        },
        media: {
          mimeType: this.getMimeType(data.fileType),
          body: this.convertToStream(data.file)
        }
      });

      return response.data.id || '';
    } catch (error) {
      throw this.handleUploadError(error);
    }
  }

  private async uploadShort(
    data: PostData,
    fields: YoutubeFields
  ): Promise<string> {
    this.validateFields(fields);

    try {
      const response = await this.youtube.videos.insert({
        part: ['snippet', 'status'],
        requestBody: {
          snippet: {
            title: fields.title,
            description: fields.description || '',
            tags: this.sanitizeTags(['#Shorts', ...(fields.tags || [])])
          },
          status: {
            privacyStatus: fields.privacyStatus || 'public'
          }
        },
        media: {
          mimeType: this.getMimeType(data.fileType),
          body: this.convertToStream(data.file)
        }
      });

      return response.data.id || '';
    } catch (error) {
      throw this.handleUploadError(error);
    }
  }

  private validateFields(fields: YoutubeFields): void {
    if (!fields.title || fields.title.trim() === '') {
      throw new Error('El título es obligatorio y no puede estar vacío');
    }

    if (fields.title.length > 100) {
      throw new Error('El título no puede exceder 100 caracteres');
    }
  }

  private getMimeType(fileType?: string): string {
    const mimeTypes: Record<string, string> = {
      'mp4': 'video/mp4',
      'mov': 'video/quicktime',
      'avi': 'video/x-msvideo',
      'webm': 'video/webm',
      'default': 'video/mp4'
    };

    return mimeTypes[fileType?.toLowerCase() || 'default'];
  }

  private sanitizeTags(tags?: string[]): string[] {
    return (tags || [])
      .filter(tag => tag && tag.trim() !== '')
      .map(tag => tag.trim())
      .slice(0, 5); // Limitar a 5 tags
  }

  private convertToStream(file: Buffer | Readable): Readable {
    // Usar Readable.from para conversión segura de Buffer
    return file instanceof Readable 
      ? file 
      : Readable.from(file);
  }

  private handleUploadError(error: any): Error {
    // Registro de error más detallado
    console.error('YouTube Upload Error:', JSON.stringify(error, null, 2));

    // Manejo de diferentes tipos de errores
    if (error.response) {
      const apiError = error.response.data.error;
      return new Error(
        `Error de API de YouTube: ${apiError.message} (Código: ${apiError.code})`
      );
    }

    return new Error(
      error.message || 'Error desconocido al subir contenido'
    );
  }
}

// Función de fábrica con tipado seguro
export function createYoutubePublisher(oauth2Client: OAuth2Client): YoutubePublisher {
  return new YoutubePublisher(oauth2Client);
}