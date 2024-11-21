import { Module } from '@nestjs/common';
import { MembersService } from './members.service';
import { MembersController } from './members.controller';
import { PrismaService } from 'src/core/prisma.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  controllers: [MembersController],
  providers: [MembersService, PrismaService, JwtService],
})
export class MembersModule { }
