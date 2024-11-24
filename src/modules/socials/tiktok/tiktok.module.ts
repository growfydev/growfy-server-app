import { Module } from '@nestjs/common';
import { TiktokService } from './tiktok.service';
import { TiktokController } from './tiktok.controller';

@Module({
  providers: [TiktokService],
  controllers: [TiktokController],
})
export class TiktokModule {}
