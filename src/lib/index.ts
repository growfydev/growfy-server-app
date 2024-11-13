import { ThreadsModule } from '../modules/api/socials/threads/threads.module';
import { SetupModule } from './setup.module';
import { AuthModule } from '../modules/auth/auth.module';
import { InstagramModule } from '../modules/api/socials/instagram/instagram.module';
import { FacebookModule } from '../modules/api/socials/facebook/facebook.module';
import { LinkedInModule } from '../modules/api/socials/linkedin/linkedin.module';
import { TiktokModule } from '../modules/api/socials/tiktok/tiktok.module';
import { TiktokAdsModule } from '../modules/api/ads/tiktok/tiktok.module';
import { XModule } from '../modules/api/socials/x/x.module';
import { PinterestModule } from '../modules/api/socials/pinterest/pinterest.module';
import { YoutubeModule } from '../modules/api/socials/youtube/youtube.module';
import { TwitchModule } from '../modules/api/socials/twitch/twitch.module';
import { WhatsappModule } from '../modules/api/socials/whatsapp/whatsapp.module';
import { WebModule } from '../modules/api/socials/web/web.module';
import { MetaModule } from '../modules/api/ads/meta/meta.module';
import { GoogleModule } from '../modules/api/ads/google/google.module';
import { TwilioModule } from '../modules/api/third-parties/twilio/twilio.module';
import { DriveModule } from '../modules/api/third-parties/drive/drive.module';
import { EmailModule } from '../modules/api/third-parties/email/email.module';
import { CanvasModule } from '../modules/api/socials/canvas/canvas.module';
import { ShopifyModule } from '../modules/api/analytics/shopify/shopify.module';
import { WoocomerceModule } from '../modules/api/analytics/woocomerce/woocomerce.module';
import { StripeModule } from '../modules/api/payments/stripe/stripe.module';

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
  StripeModule
];
