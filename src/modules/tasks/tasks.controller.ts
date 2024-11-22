import { Controller, Post, Body, Param } from '@nestjs/common';
import { Auth } from '../auth/decorators/auth.decorator';
import { TaskProducer } from './tasks.producer';
import { CoreRole } from '@prisma/client';

@Controller('profiles/:profileId/posts/:postId/tasks')
export class TaskController {
    constructor(private readonly taskProducer: TaskProducer) { }

    @Post('schedule')
    @Auth([CoreRole.USER], ['MANAGEMENT'])
    async scheduleTask(
        @Param('profileId') profileId: number,
        @Param('postId') postId: number,
        @Body('unixTimestamp') unixTimestamp: number,
        @Body('message') message: string,
    ) {
        await this.taskProducer.scheduleTask(profileId, postId, unixTimestamp, message);
        return { message: 'Task scheduled successfully' };
    }
}
