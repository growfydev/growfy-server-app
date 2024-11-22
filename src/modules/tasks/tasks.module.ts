import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { TaskConsumer } from './tasks.consumer';
import { TaskProducer } from './tasks.producer';
import { TaskController } from './tasks.controller';
import { PrismaService } from 'src/core/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [
        BullModule.registerQueue({
            name: 'taskQueue',
        }),
        AuthModule
    ],
    controllers: [TaskController],
    providers: [TaskProducer, TaskConsumer, PrismaService, JwtService],
    exports: [TaskProducer],
})
export class TaskModule { }
