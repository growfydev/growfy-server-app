import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';

@Processor('taskQueue')
export class TaskConsumer {
    @Process('executeOnce')
    async handleExecuteOnce(job: Job) {
        const { message } = job.data;
        console.log(`Executed succesfully: ${message}`);
    }
}
