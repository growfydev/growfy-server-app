import { BullModule } from '@nestjs/bull';
import { PrismaService } from 'src/core/prisma.service';
import { configLoader } from 'src/lib/config.loader';
import { PostsModule } from '../posts/posts.module';
import { TaskQueueProcessor } from './task.processor';
import { TaskQueueService } from './tasks-queue.service';
import { Module } from '@nestjs/common';

@Module({
	imports: [
		BullModule.forRoot({
			redis: {
				host: configLoader().redis.host,
				port: configLoader().redis.port,
			},
		}),
		BullModule.registerQueue({
			name: 'taskQueue',
		}),
		PostsModule,
	],
	controllers: [],
	providers: [PrismaService, TaskQueueService, TaskQueueProcessor],
	exports: [TaskQueueService, TaskQueueProcessor, BullModule],
})
export class TaskModule {}
