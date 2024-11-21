import { forwardRef, Module } from '@nestjs/common';
import { FacebookModule } from './facebook/facebook.module';
import { InstagramModule } from './instagram/instagram.module';
import { SocialsController } from './socials.controller';
import { SocialsService } from './socials.service';

@Module({
  imports: [
    forwardRef(() => FacebookModule),
    forwardRef(() => InstagramModule),
  ],
  controllers: [SocialsController],
  providers: [SocialsService],
  exports: [SocialsService],
})
export class SocialsModule {}
