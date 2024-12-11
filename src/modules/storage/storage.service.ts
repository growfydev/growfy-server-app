import { Injectable, BadRequestException } from '@nestjs/common';
import { Dropbox } from 'dropbox';
import * as fs from 'fs';
import { configLoader } from 'src/lib/ConfigLoader';

@Injectable()
export class StorageService {
  private readonly dropboxClient: Dropbox;

  constructor() {
    const accessToken = configLoader().dropbox.api_key;
    if (!accessToken) {
      throw new Error('Falta el token de acceso de Dropbox en las variables de entorno.');
    }

    this.dropboxClient = new Dropbox({ accessToken });
  }

  async uploadFile(filePath: string, dropboxPath: string): Promise<any> {
    try {
      const fileContent = fs.readFileSync(filePath); // Leer el archivo local
      const response = await this.dropboxClient.filesUpload({
        path: dropboxPath,
        contents: fileContent,
      });
      return response.result;
    } catch (error) {
      throw new BadRequestException(
        `Error al subir el archivo: ${error.message}`,
      );
    }
  }

  async listFiles(folderPath: string): Promise<any> {
    try {
      const response = await this.dropboxClient.filesListFolder({
        path: folderPath,
      });
      return response.result.entries;
    } catch (error) {
      console.log(error)
      throw new BadRequestException(
        `Error al listar archivos: ${error.message}`,
      );
    }
  }

  async downloadFile(dropboxPath: string): Promise<Buffer> {
    try {
      const response = await this.dropboxClient.filesDownload({ path: dropboxPath });
      const fileBinary = (response.result as any).fileBinary as Buffer;
      return fileBinary;
    } catch (error) {
      throw new BadRequestException(
        `Error al descargar el archivo: ${error.message}`,
      );
    }
  }
}
