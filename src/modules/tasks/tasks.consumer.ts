import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';

@Processor('taskQueue')
export class TaskConsumer {
  @Process('*') // Generic handler for any task
  async handleTask(job: Job) {
    const { taskName, ...taskData } = job.data;

    console.log(`Executing task "${job.name}" with data:`, taskData);

    // Add specific task handlers if needed
    if (job.name === 'executeOnce') {
      console.log(`Task-specific logic: ${taskData.message}`);
    }
  }
}
