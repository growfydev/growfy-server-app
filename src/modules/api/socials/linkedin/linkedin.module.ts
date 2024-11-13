import { Module } from '@nestjs/common';
import { LinkedInService } from './linkedin.service';
import { LinkedinController } from './linkedin.controller';
import { HttpModule } from '@nestjs/axios';
import { PrismaService } from 'src/core/prisma.service';

@Module({
  imports: [HttpModule],
  providers: [LinkedInService, PrismaService],
  controllers: [LinkedinController]
})
export class LinkedinModule { }
