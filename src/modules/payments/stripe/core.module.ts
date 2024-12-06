import { DynamicModule, Module, Provider } from '@nestjs/common';
import { Services } from 'src/common/constants';
import Stripe from 'stripe';
import { StripeModule } from './stripe.module';

@Module({})
export class StripeCoreModule {
	static forRoot(key: string, options: Stripe.StripeConfig): DynamicModule {
		const core = new Stripe(key, options);
		const provider: Provider = {
			provide: Services.Stripe,
			useValue: core,
		};
		return {
			module: StripeModule,
			providers: [provider],
			exports: [provider],
			global: true,
		};
	}
}
