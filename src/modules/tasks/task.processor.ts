import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { PostsService } from '../posts/posts.service';
import { Service as ProcessorService } from 'src/service';
import { TaskQueueService } from './tasks-queue.service';
import { Queues } from './constants';

@Processor(Queues.TASK)
export class TaskQueueProcessor extends ProcessorService {
	constructor(
		private readonly postsService: PostsService,
		private readonly queueService: TaskQueueService,
	) {
		super(TaskQueueProcessor.name);
	}

	@Process('publishPost')
	async handlePostPublish(job: Job) {
		const { profileId, postId } = job.data;
		await this.postsService.publishPost(profileId, postId);
		const status = await this.queueService.getPostStatus(postId);
		this.logger.log(
			`Job queued for post ${postId} and profile ${profileId} has been finished. Status: ${status}`,
		);
	}
}
