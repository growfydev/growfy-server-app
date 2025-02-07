import { Module } from '@nestjs/common';
import { StripeCoreModule } from './core.module';
import configLoader from 'src/lib/ConfigLoader';

@Module({
	imports: [
		StripeCoreModule.forRoot(configLoader().stripe.key, {
			apiVersion: '2025-01-27.acacia',
		}),
	],
})
export class StripeModule {}
