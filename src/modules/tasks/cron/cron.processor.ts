import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { CronTaskService } from './cron.service';
import { Queues } from '../constants';
import { Service } from 'src/service';

@Processor(Queues.CRON)
export class CronTaskProcessor extends Service {
	constructor(private readonly cronTaskService: CronTaskService) {
		super(CronTaskProcessor.name);
	}

	@Process()
	async handleTask(job: Job) {
		const { methodName } = job.data;
		this.logger.log(`Ejecutando tarea: ${methodName}, Job ID: ${job.id}`);
		await this.cronTaskService.executeTask(job.data);
	}
}
