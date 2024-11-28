import { Module } from '@nestjs/common';
import { SmsService } from './sms.service';
import { SmsController } from './sms.controller';
import { PrismaService } from 'src/core/prisma.service';

@Module({
  providers: [SmsService, PrismaService],
  controllers: [SmsController]
  // Remove the incorrect imports line
})
export class TwilioModule { }