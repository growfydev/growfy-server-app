import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { configLoader } from 'src/lib/config.loader';

@Module({
  imports: [
    BullModule.forRoot({
      redis: {
        host: configLoader().redis.host,
        port: configLoader().redis.port,
      },
    }),
    BullModule.registerQueue({
      name: 'taskQueue',
    }),
  ],
})
export class AppModule {}
