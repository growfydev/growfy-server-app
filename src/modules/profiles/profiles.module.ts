import { Module } from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { ProfilesController } from './profiles.controller';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/core/prisma.service';

@Module({
  controllers: [ProfilesController],
  providers: [ProfilesService, PrismaService, JwtService],
})
export class ProfilesModule { }
