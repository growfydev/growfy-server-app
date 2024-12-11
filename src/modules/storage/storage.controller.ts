import { Controller, Get, Post, Body, Patch, Res, Param, Delete, UploadedFile, UseInterceptors, Query } from '@nestjs/common';
import { StorageService } from './storage.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';

@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}
 
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('dropboxPath') dropboxPath: string,
  ) {
    if (!file) {
      throw new Error('Debe proporcionar un archivo para subir.');
    }

    const tempPath = file.path || file.originalname; // Dependiendo del manejo de archivos
    return this.storageService.uploadFile(tempPath, dropboxPath);
  }

  @Get('list')
  async listFiles(@Query('folderPath') folderPath: string) {
    return this.storageService.listFiles(folderPath || '');
  }

  @Get('download')
  async downloadFile(@Query('dropboxPath') dropboxPath: string, @Res() res: Response) {
    const fileContent = await this.storageService.downloadFile(dropboxPath);
    res.setHeader('Content-Disposition', `attachment; filename="${dropboxPath}"`);
    res.end(fileContent);
  }
}
