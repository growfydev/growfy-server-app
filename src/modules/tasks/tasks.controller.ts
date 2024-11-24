import { Controller, Post, Body } from '@nestjs/common';
import { TaskProducer } from './tasks.producer';

@Controller('tasks')
export class TaskController {
  constructor(private readonly taskProducer: TaskProducer) {}

  @Post('schedule')
  async scheduleTask(
    @Body('unixTimestamp') unixTimestamp: number,
    @Body('message') message: string,
  ) {
    await this.taskProducer.scheduleTask(unixTimestamp, message);
    return { message: 'Successfuly scheduled task.' };
  }
}
