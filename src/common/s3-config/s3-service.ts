import { Inject, Injectable } from '@nestjs/common';
import {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
    PutObjectCommandInput,
    DeleteObjectCommandInput
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class S3Service {
    constructor(
        @Inject('S3_CLIENT') private s3Client: S3Client,
        @Inject('AWS_S3_BUCKET') private bucketName: string
    ) { }

    async uploadFile(
        file: Express.Multer.File,
        folder: string = 'uploads',
        customBucket?: string
    ): Promise<string> {
        const key = `${folder}/${Date.now()}-${file.originalname}`;

        const params: PutObjectCommandInput = {
            Bucket: customBucket || this.bucketName,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
        };

        try {
            const command = new PutObjectCommand(params);
            await this.s3Client.send(command);

            return await this.getPresignedUrl(key, customBucket);
        } catch (error) {
            throw new Error(`File upload failed: ${error.message}`);
        }
    }

    async getFile(
        fileKey: string,
        customBucket?: string
    ): Promise<string> {
        try {
            return await this.getPresignedUrl(fileKey, customBucket);
        } catch (error) {
            throw new Error(`File retrieval failed: ${error.message}`);
        }
    }

    async updateFile(
        fileKey: string,
        file: Express.Multer.File,
        customBucket?: string
    ): Promise<string> {
        const params: PutObjectCommandInput = {
            Bucket: customBucket || this.bucketName,
            Key: fileKey,
            Body: file.buffer,
            ContentType: file.mimetype,
        };

        try {
            const command = new PutObjectCommand(params);
            await this.s3Client.send(command);

            return await this.getPresignedUrl(fileKey, customBucket);
        } catch (error) {
            throw new Error(`File update failed: ${error.message}`);
        }
    }

    async deleteFile(
        fileKey: string,
        customBucket?: string
    ): Promise<void> {
        const params: DeleteObjectCommandInput = {
            Bucket: customBucket || this.bucketName,
            Key: fileKey
        };

        try {
            const command = new DeleteObjectCommand(params);
            await this.s3Client.send(command);
        } catch (error) {
            throw new Error(`File deletion failed: ${error.message}`);
        }
    }

    private async getPresignedUrl(
        key: string,
        customBucket?: string,
        expiresIn: number = 3600
    ): Promise<string> {
        const command = new GetObjectCommand({
            Bucket: customBucket || this.bucketName,
            Key: key
        });

        try {
            return await getSignedUrl(this.s3Client, command, { expiresIn });
        } catch (error) {
            throw new Error(`Failed to generate presigned URL: ${error.message}`);
        }
    }
}