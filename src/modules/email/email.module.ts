import { Module, DynamicModule, Global, Provider } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailModuleOptions } from './types';
import { EmailProvider } from './constants';

@Global()
@Module({})
export class EmailModule {
	static register(options: EmailModuleOptions): DynamicModule {
		const optionsProvider: Provider<EmailModuleOptions> = {
			provide: EmailProvider.Options,
			useValue: options,
		};

		return {
			module: EmailModule,
			providers: [optionsProvider, EmailService],
			exports: [EmailService],
		};
	}

	static registerAsync(options: {
		useFactory: (
			...args: unknown[]
		) => EmailModuleOptions | Promise<EmailModuleOptions>;
		inject?: Array<Provider | string | symbol>;
	}): DynamicModule {
		const optionsProvider: Provider<EmailModuleOptions> = {
			provide: EmailProvider.Options,
			useFactory: options.useFactory,
			inject: (options.inject || []) as Array<string | symbol>,
		};

		return {
			module: EmailModule,
			providers: [optionsProvider, EmailService],
			exports: [EmailService],
		};
	}
}
