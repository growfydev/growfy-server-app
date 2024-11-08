import { PrismaClient } from '@prisma/client';
import { Injectable, OnModuleInit } from '@nestjs/common';

/**
 * This is the main database management service, this must be injected in every class that will manipulate the database
 * check the AppModule class for reference. Further information please read: https://pris.ly/d/prisma-schema
 */

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }
}
