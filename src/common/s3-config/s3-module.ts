import { Module, Global, DynamicModule } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
    S3Client,
} from '@aws-sdk/client-s3';
import { configLoader } from 'src/lib/config.loader';
@Global()
@Module({})
export class S3GlobalModule {
    static register(): DynamicModule {
        return {
            module: S3GlobalModule,
            providers: [
                {
                    provide: 'S3_CLIENT',
                    useFactory: (configService: ConfigService) => {
                        return new S3Client({
                            region: configLoader().s3.region,
                            credentials: {
                                accessKeyId: configLoader().s3.key_id,
                                secretAccessKey: configLoader().s3.access_key
                            }
                        });
                    },
                    inject: [ConfigService],
                },
                {
                    provide: 'AWS_S3_BUCKET',
                    useFactory: (configService: ConfigService) =>
                        configLoader().s3.bucket_name,
                    inject: [ConfigService],
                }
            ],
            exports: ['S3_CLIENT', 'AWS_S3_BUCKET'],
        };
    }
}