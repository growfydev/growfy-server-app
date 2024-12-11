import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { configLoader } from '../../lib/ConfigLoader';
import { envSchema } from '../../lib/SchemaValidator';

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
