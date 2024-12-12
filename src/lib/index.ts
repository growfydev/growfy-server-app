import { SetupModule } from '../modules/config/setup.module';
import { AuthModule } from '../modules/auth/auth.module';
import { SmsModule } from '../modules/third-parties/sms/sms.module';
import { StripeModule } from '../modules/payments/stripe/stripe.module';
import { TaskModule } from 'src/modules/tasks/tasks.module';
import { ProfilesModule } from 'src/modules/profiles/profiles.module';
import { PostsModule } from '../modules/posts/posts.module';
import { ProviderModule } from '../modules/provider/provider.module';
import { CustomerModule } from '../modules/customer/customer.module';
import { StorageModule } from 'src/modules/storage/storage.module';

const CoreModules = [
	SetupModule,
	PostsModule,
	ProviderModule,
	CustomerModule,
	StorageModule,
];

const AuthModules = [AuthModule];

const ThirdPartyModules = [SmsModule];

const PaymentModules = [StripeModule];

const TaskManagementModules = [ProfilesModule, TaskModule];

const Modules = [
	...CoreModules,
	...AuthModules,
	...ThirdPartyModules,
	...PaymentModules,
	...TaskManagementModules,
];

export default Modules;
