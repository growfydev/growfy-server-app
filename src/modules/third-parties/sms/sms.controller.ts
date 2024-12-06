import {
    Controller,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { SmsService } from './sms.service';

@Controller('sms')
export class SmsController {
    constructor(private readonly smsService: SmsService) { }

}