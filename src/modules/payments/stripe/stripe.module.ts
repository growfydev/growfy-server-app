import { Module } from '@nestjs/common';
import { StripeCoreModule } from './core.module';
import { configLoader } from 'src/lib/config.loader';

@Module({
  imports: [
    StripeCoreModule.forRoot(configLoader().stripe.key, {
      apiVersion: '2024-11-20.acacia',
    }),
  ],
})
export class StripeModule {}
