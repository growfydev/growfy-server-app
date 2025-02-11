import { forwardRef, Module } from '@nestjs/common';
import { EmailMarketingService } from './email-marketing.service';
import { EmailMarketingController } from './email-marketing.controller';
import { Mailchimp } from './providers/mailchimp/mailchimp.provider';
import { ActiveCampaign } from './providers/active-campaign/active-campaign.provider';
import { KlaviyoProvider } from './providers/klaviyo/klaviyo.provider';
import { JwtService } from '@nestjs/jwt';
import { AuthModule } from '../auth/auth.module';

@Module({
	imports: [forwardRef(() => AuthModule)],
	controllers: [EmailMarketingController],
	providers: [
		EmailMarketingService,
		Mailchimp,
		ActiveCampaign,
		KlaviyoProvider,
		JwtService,
	],
})
export class EmailMarketingModule {}
