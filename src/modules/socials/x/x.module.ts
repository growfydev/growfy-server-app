import { Module } from '@nestjs/common';
import { XService } from './x.service';
import { XController } from './x.controller';

@Module({
	providers: [XService],
	controllers: [XController],
})
export class XModule {}
