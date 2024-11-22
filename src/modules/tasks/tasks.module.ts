import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { TaskConsumer } from './tasks.consumer';
import { TaskProducer } from './tasks.producer';
import { TaskController } from './tasks.controller';

@Module({
    imports: [
        BullModule.registerQueue({
            name: 'taskQueue',
        }),
    ],
    controllers: [TaskController],
    providers: [TaskProducer, TaskConsumer],
    exports: [TaskProducer],
})
export class TaskModule { }
