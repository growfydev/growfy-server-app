import { Module } from '@nestjs/common';
import { PrismaService } from 'src/core/prisma.service';

@Module({
	controllers: [],
	providers: [PrismaService],
})
export class LinkedInModule {}
