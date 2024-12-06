import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/prisma.service';

@Injectable()
export class SmsService {
	constructor(private readonly prisma: PrismaService) {}
}
