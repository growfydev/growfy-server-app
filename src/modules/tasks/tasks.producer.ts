import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from 'src/core/prisma.service';

@Injectable()
export class TaskProducer {
    constructor(
        @InjectQueue('taskQueue') private taskQueue: Queue,
        private prisma: PrismaService,
    ) { }

    async scheduleTask(profileId: number, postId: number, unixTimestamp: number, message: string) {
        const delay = unixTimestamp * 1000 - Date.now();

        if (delay < 0) {
            throw new Error('The timestamp must be in the future');
        }

        const post = await this.prisma.post.findFirst({
            where: {
                id: postId,
                profile: { id: profileId },
            },
            include: { profile: true },
        });

        if (!post) {
            throw new Error('Post does not belong to the specified profile.');
        }

        const task = await this.prisma.task.create({
            data: {
                status: 'SCHEDULED',
                unix: unixTimestamp.toString(),
                postId: postId,
            },
        });

        await this.taskQueue.add(
            'executeTask',
            { taskId: task.id, message },
            { delay },
        );
    }
}
