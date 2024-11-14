import { Module } from '@nestjs/common';
import { StripeCoreModule } from './core.module';
import { configLoader } from 'src/lib/config.loader';

@Module({
    imports: [StripeCoreModule.forRoot(configLoader().stripe.key, { apiVersion: '2024-10-28.acacia' })]
})
export class StripeModule { }
