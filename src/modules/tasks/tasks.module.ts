import { BullModule } from '@nestjs/bull';
import { PrismaService } from 'src/core/prisma.service';
import configLoader from 'src/lib/ConfigLoader';
import { PostsModule } from '../posts/posts.module';
import { TaskQueueProcessor } from './task.processor';
import { TaskQueueService } from './tasks-queue.service';
import { Module } from '@nestjs/common';
import { Queues } from './constants';
import { CronTaskService } from './cron/cron.service';
import { CronTaskProcessor } from './cron/cron.processor';

@Module({
	imports: [
		BullModule.forRoot({
			redis: {
				host: configLoader().redis.host,
				port: configLoader().redis.port,
			},
		}),
		BullModule.registerQueue({
			name: Queues.TASK,
		}),
		BullModule.registerQueue({
			name: Queues.CRON,
		}),
		PostsModule,
	],
	providers: [
		PrismaService,
		TaskQueueService,
		TaskQueueProcessor,
		CronTaskService,
		CronTaskProcessor,
	],
	exports: [TaskQueueService, TaskQueueProcessor, BullModule],
})
export class TaskModule {}
