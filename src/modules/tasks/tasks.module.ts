import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { PrismaService } from 'src/core/prisma.service';
import { AuthModule } from '../auth/auth.module';
import { TaskQueueService } from './tasks-queue.service';
import { TaskQueueProcessor } from './task.processor';
import { PostsService } from '../posts/posts.service';
import { PostsModule } from '../posts/posts.module';

@Module({
    imports: [
        BullModule.registerQueue({
            name: 'taskQueue',
        }),
        AuthModule,
        PostsModule
    ],
    controllers: [],
    providers: [TaskQueueService, TaskQueueProcessor],
    exports: [TaskQueueService, TaskQueueProcessor],
})
export class TaskModule { }
