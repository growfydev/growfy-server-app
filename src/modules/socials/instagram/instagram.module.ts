import { forwardRef, Module } from '@nestjs/common';
import { InstagramService } from './instagram.service';
import { SocialsModule } from '../socials.module';

@Module({
  imports: [forwardRef(() => SocialsModule)],
  providers: [InstagramService],
  exports: [InstagramService],
})
export class InstagramModule {}
