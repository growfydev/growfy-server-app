import { Module } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CustomerController } from './customer.controller';
import { PrismaService } from 'src/core/prisma.service';

@Module({
  controllers: [CustomerController, PrismaService],
  providers: [CustomerService],
})
export class CustomerModule { }
