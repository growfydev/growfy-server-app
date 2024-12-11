import { BullModule } from '@nestjs/bull';
import { PrismaService } from 'src/core/prisma.service';
import { configLoader } from 'src/lib/ConfigLoader';
import { PostsModule } from '../posts/posts.module';
import { TaskQueueProcessor } from './task.processor';
import { TaskQueueService } from './tasks-queue.service';
import { Module } from '@nestjs/common';
import { Queues } from './constants';

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
		PostsModule,
	],
	providers: [PrismaService, TaskQueueService, TaskQueueProcessor],
	exports: [TaskQueueService, TaskQueueProcessor, BullModule],
})
export class TaskModule {}
