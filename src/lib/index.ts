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
import { ShopifyModule } from 'src/modules/shopify/shopify.module';
import { WebsocketModule } from 'src/modules/websocket/websocket.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TickesModule } from 'src/ticket/tickes.module';

const CoreModules = [
	TickesModule,
	SetupModule,
	PostsModule,
	ProviderModule,
	CustomerModule,
	StorageModule,
	ShopifyModule,
	EventEmitterModule.forRoot(),
];

const AuthModules = [AuthModule];
const realTimeModules = [WebsocketModule];

const ThirdPartyModules = [SmsModule];

const PaymentModules = [StripeModule];

const TaskManagementModules = [ProfilesModule, TaskModule];

const Modules = [
	...CoreModules,
	...AuthModules,
	...ThirdPartyModules,
	...PaymentModules,
	...TaskManagementModules,
	...realTimeModules,
];

export default Modules;
