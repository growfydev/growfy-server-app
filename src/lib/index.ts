import { ThreadsModule } from '../modules/socials/threads/threads.module';
import { SetupModule } from '../modules/config/setup.module';
import { AuthModule } from '../modules/auth/auth.module';
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
import { TaskModule } from 'src/modules/tasks/tasks.module';
import { ProfilesModule } from 'src/modules/profiles/profiles.module';
import { PostsModule } from '../modules/posts/posts.module';

const CoreModules = [SetupModule, PostsModule];

const AuthModules = [AuthModule];

const SocialModules = [
  ThreadsModule,
  TiktokModule,
  XModule,
  LinkedInModule,
  PinterestModule,
  YoutubeModule,
  TwitchModule,
  WhatsappModule,
  WebModule,
  CanvasModule,
];

const AdsModules = [TiktokAdsModule, MetaModule, GoogleModule];

const ThirdPartyModules = [TwilioModule, DriveModule, EmailModule];

const AnalyticsModules = [ShopifyModule, WoocomerceModule];

const PaymentModules = [StripeModule];

const TaskManagementModules = [ProfilesModule, TaskModule];

const Modules = [
  ...CoreModules,
  ...AuthModules,
  ...SocialModules,
  ...AdsModules,
  ...ThirdPartyModules,
  ...AnalyticsModules,
  ...PaymentModules,
  ...TaskManagementModules,
];

export default Modules;
