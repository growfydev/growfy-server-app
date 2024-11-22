import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class TaskProducer {
    constructor(@InjectQueue('taskQueue') private taskQueue: Queue) { }

    async scheduleTask(unixTimestamp: number, message: string) {
        const delay = unixTimestamp * 1000 - Date.now();

        if (delay < 0) {
            throw new Error('Timestamp must be a future date.');
        }

        await this.taskQueue.add(
            'executeOnce',
            { message },
            { delay }
        );
    }
}
