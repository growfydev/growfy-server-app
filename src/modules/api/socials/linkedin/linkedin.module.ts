import { Module } from '@nestjs/common';
import { PrismaService } from 'src/core/prisma.service';
import { LinkedInStrategy } from './auth/strategy';
import { LinkedInController } from './linkedin.controller';
import { LinkedInAuthGuard } from './linkedin.guard';
import { LinkedInService } from './linkedin.service';

@Module({
  controllers: [LinkedInController],
  providers: [LinkedInStrategy, LinkedInService, PrismaService, LinkedInAuthGuard],
})
export class LinkedInModule { }
