import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Service } from 'src/service';

@Injectable()
export class TaskQueueService extends Service {
	constructor(@InjectQueue('taskQueue') private readonly taskQueue: Queue) {
		super(TaskQueueService.name);
	}

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

		this.logger.debug(
			`New task added to the queue for profile id: ${profileId}, and post id ${postId}`,
		);
	}
}
