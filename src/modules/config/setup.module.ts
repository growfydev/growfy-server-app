import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { configLoader } from '../../lib/config.loader';
import { envSchema } from '../../lib/validation.schema';

@Module({
	imports: [
		ConfigModule.forRoot({
			load: [configLoader],
			validationSchema: envSchema,
			isGlobal: true,
		}),
	],
})
export class SetupModule {}
