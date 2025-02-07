import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configLoader from '../../lib/ConfigLoader';
import { envSchema } from '../../lib/SchemaValidator';
import { EmailModule } from '../email/email.module';
import { ConfigService } from '@nestjs/config';

@Module({
	imports: [
		ConfigModule.forRoot({
			load: [configLoader],
			validationSchema: envSchema,
			isGlobal: true,
		}),
		EmailModule.registerAsync({
			useFactory: async (configService: ConfigService) => ({
				host: configService.get<string>('SMTP_HOST'),
				port: configService.get<number>('SMTP_PORT'),
				secure: configService.get<boolean>('SMTP_SECURE'),
				auth: {
					user: configService.get<string>('SMTP_USER'),
					pass: configService.get<string>('SMTP_PASS'),
				},
			}),
			inject: [ConfigService],
		}),
	],
})
export class SetupModule {}
