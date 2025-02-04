import { Controller } from '@nestjs/common';
import { EmailMarketingService } from './email-marketing.service';

@Controller('email-marketing')
export class EmailMarketingController {
	constructor(
		private readonly emailMarketingService: EmailMarketingService,
	) {}
}
