import {
  Injectable,
  Inject,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { google, drive_v3 } from 'googleapis';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class StorageService {
  private oauth2Client;
  private drive: drive_v3.Drive;
  private readonly prisma: PrismaClient;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI,
    );

    this.drive = google.drive({ version: 'v3', auth: this.oauth2Client });
    this.prisma = new PrismaClient();
  }

  generateAuthUrl(): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/drive'],
    });
  }

  async setCredentials(profileId: number, service: string, code: string): Promise<void> {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      this.oauth2Client.setCredentials(tokens);

      await this.saveToken(
        profileId,
        service,
        tokens.access_token!,
        tokens.refresh_token,
        tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
      );
    } catch (error) {
      throw new InternalServerErrorException('Error setting credentials: ' + error.message);
    }
  }

  async listFiles(profileId: number, service: string): Promise<drive_v3.Schema$File[]> {
    try {
  
      await this.loadToken(profileId, service);

      const res = await this.drive.files.list({
        pageSize: 50,
        fields: 'files(id, name, mimeType, webViewLink, thumbnailLink)',
      });

      return res.data.files || [];
    } catch (error) {
      throw new InternalServerErrorException('Error listing files: ' + error.message);
    }
  }

  async uploadFile(
    profileId: number,
    service: string,
    filePath: string,
    mimeType: string,
  ): Promise<drive_v3.Schema$File | null> {
    try {
      await this.loadToken(profileId, service);

      const fileName = path.basename(filePath);

      const res = await this.drive.files.create({
        requestBody: {
          name: fileName,
        },
        media: {
          mimeType,
          body: fs.createReadStream(filePath),
        },
      });

      return res.data;
    } catch (error) {
      throw new InternalServerErrorException('Error uploading file: ' + error.message);
    }
  }

  private async saveToken(
    profileId: number,
    service: string,
    accessToken: string,
    refreshToken?: string,
    expiryDate?: Date,
  ): Promise<void> {
    try {
      const existingRecord = await this.prisma.storageProfile.findUnique({
        where: { profileId_service: { profileId, service:"GOOGLE_DRIVE" } },
      });

      if (existingRecord) {
        await this.prisma.storageProfile.update({
          where: { id: existingRecord.id },
          data: {
            accessToken,
            refreshToken,
            expiryDate,
            updatedAt: new Date(),
          },
        });
      } else {
        await this.prisma.storageProfile.create({
          data: {
            profileId,
            service:'GOOGLE_DRIVE',
            accessToken,
            refreshToken,
            expiryDate,
          },
        });
      }
    } catch (error) {
      throw new InternalServerErrorException('Error saving token: ' + error.message);
    }
  }

  private async loadToken(profileId: number, service: string): Promise<void> {
    try {
      console.log(profileId)
      const tokenRecord = await this.prisma.storageProfile.findUnique({
        where: { profileId_service: { profileId:1, service:'GOOGLE_DRIVE' } },
      });

      if (!tokenRecord) {
        throw new NotFoundException('Token not found for the given profile and service.');
      }

      this.oauth2Client.setCredentials({
        access_token: tokenRecord.accessToken,
        refresh_token: tokenRecord.refreshToken,
        expiry_date: tokenRecord.expiryDate?.getTime(),
      });
    } catch (error) {
      throw new InternalServerErrorException('Error loading token: ' + error.message);
    }
  }
}
