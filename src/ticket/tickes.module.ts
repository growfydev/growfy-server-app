import { Module } from '@nestjs/common';
import { TicketsService } from './tickes.service';
import { TicketsController } from './tickes.controller';

@Module({
	controllers: [TicketsController],
	providers: [TicketsService],
})
export class TickesModule {}
