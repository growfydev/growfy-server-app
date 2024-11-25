import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class TaskQueueService {
    constructor(@InjectQueue('taskQueue') private readonly taskQueue: Queue) { }

    async scheduleTask(
        profileId: number,
        postId: number,
        unixTime: number,
    ): Promise<void> {
        const delay = Math.max(unixTime * 1000 - Date.now(), 0);

        await this.taskQueue.add(
            'publishPost',
            { profileId, postId },
            { delay },
        );
    }
}
