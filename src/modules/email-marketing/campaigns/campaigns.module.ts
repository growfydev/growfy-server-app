import { Module } from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import { CampaignsController } from './campaigns.controller';
import { MailchimpService } from './providers/mailchimp.service';
import { Service } from './providers/.service';
import { ActivecampaignService } from './providers/activecampaign.service';
import { KlaviyoService } from './providers/klaviyo.service';

@Module({
	controllers: [CampaignsController],
	providers: [
		CampaignsService,
		MailchimpService,
		Service,
		ActivecampaignService,
		KlaviyoService,
	],
})
export class CampaignsModule {}
