import { Module } from '@nestjs/common';
import { EmailMarketingService } from './email-marketing.service';
import { EmailMarketingController } from './email-marketing.controller';
import { Mailchimp } from './providers/mailchimp/mailchimp.provider';
import { Mailchimp } from './providers/mailchimp/mailchimp.provider';
import { ActiveCampaign } from './providers/active-campaign/active-campaign.provider';
import { KlaviyoProvider } from './providers/klaviyo/klaviyo.provider';

@Module({
	controllers: [EmailMarketingController],
	providers: [
		EmailMarketingService,
		Mailchimp,
		ActiveCampaign,
		KlaviyoProvider,
	],
})
export class EmailMarketingModule {}
