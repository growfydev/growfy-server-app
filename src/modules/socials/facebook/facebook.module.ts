import { forwardRef, Module } from '@nestjs/common';
import { FacebookService } from './facebook.service';
import { SocialsModule } from '../socials.module';

@Module({
  imports: [forwardRef(() => SocialsModule)],
  providers: [FacebookService],
  exports: [FacebookService],
})
export class FacebookModule {}
