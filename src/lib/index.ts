import { SetupModule } from '../modules/config/setup.module';
import { AuthModule } from '../modules/auth/auth.module';
import { YouTubeModule } from '../modules/socials/youtube/youtube.module';
import { TwilioModule } from '../modules/third-parties/sms/sms.module';
import { StripeModule } from '../modules/payments/stripe/stripe.module';
import { TaskModule } from 'src/modules/tasks/tasks.module';
import { ProfilesModule } from 'src/modules/profiles/profiles.module';
import { PostsModule } from '../modules/posts/posts.module';
import { ProviderModule } from '../modules/provider/provider.module';
import { CustomerModule } from '../modules/customer/customer.module';

const CoreModules = [SetupModule, PostsModule, ProviderModule, CustomerModule];

const AuthModules = [AuthModule];

const SocialModules = [YouTubeModule];

const ThirdPartyModules = [TwilioModule];

const PaymentModules = [StripeModule];

const TaskManagementModules = [ProfilesModule, TaskModule];

const Modules = [
	...CoreModules,
	...AuthModules,
	...SocialModules,
	...ThirdPartyModules,
	...PaymentModules,
	...TaskManagementModules,
];

export default Modules;
