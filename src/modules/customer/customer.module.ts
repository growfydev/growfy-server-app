import { Module } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CustomerController } from './customer.controller';
import { PrismaService } from 'src/core/prisma.service';
import { SocketGateway } from '../websocket/websocket.gateway';
@Module({
	controllers: [CustomerController],
	providers: [CustomerService, PrismaService, SocketGateway],
	exports: [CustomerService],
})
export class CustomerModule {}
