import { ThreadsModule } from '../modules/socials/threads/threads.module';
import { SetupModule } from './setup.module';
import { AuthModule } from '../modules/auth/auth.module';
import { InstagramModule } from '../modules/socials/instagram/instagram.module';
import { FacebookModule } from '../modules/socials/facebook/facebook.module';
import { LinkedInModule } from '../modules/socials/linkedin/linkedin.module';
import { TiktokModule } from '../modules/socials/tiktok/tiktok.module';
import { TiktokAdsModule } from '../modules/ads/tiktok/tiktok.module';
import { XModule } from '../modules/socials/x/x.module';
import { PinterestModule } from '../modules/socials/pinterest/pinterest.module';
import { YoutubeModule } from '../modules/socials/youtube/youtube.module';
import { TwitchModule } from '../modules/socials/twitch/twitch.module';
import { WhatsappModule } from '../modules/socials/whatsapp/whatsapp.module';
import { WebModule } from '../modules/socials/web/web.module';
import { MetaModule } from '../modules/ads/meta/meta.module';
import { GoogleModule } from '../modules/ads/google/google.module';
import { TwilioModule } from '../modules/third-parties/twilio/twilio.module';
import { DriveModule } from '../modules/third-parties/drive/drive.module';
import { EmailModule } from '../modules/third-parties/email/email.module';
import { CanvasModule } from '../modules/socials/canvas/canvas.module';
import { ShopifyModule } from '../modules/analytics/shopify/shopify.module';
import { WoocomerceModule } from '../modules/analytics/woocomerce/woocomerce.module';
import { StripeModule } from '../modules/payments/stripe/stripe.module';

import { ProfilesModule } from 'src/modules/profiles/profiles.module';

export const Modules = [
  SetupModule,
  AuthModule,
  InstagramModule,
  FacebookModule,
  ThreadsModule,
  TiktokAdsModule,
  TiktokModule,
  XModule,
  LinkedInModule,
  PinterestModule,
  YoutubeModule,
  TwitchModule,
  WhatsappModule,
  WebModule,
  MetaModule,
  GoogleModule,
  TwilioModule,
  DriveModule,
  EmailModule,
  CanvasModule,
  ShopifyModule,
  WoocomerceModule,
  StripeModule,

  ProfilesModule,
];
