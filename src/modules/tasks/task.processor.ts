import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { PostsService } from '../posts/posts.service';
import { Service as ProcessorService } from 'src/service';
import { TaskQueueService } from './tasks-queue.service';
import { PublishPostJobData } from './types';
import { Queues, Tasks } from './constants';

@Processor(Queues.TASK)
export class TaskQueueProcessor extends ProcessorService {
	constructor(
		private readonly postsService: PostsService,
		private readonly queueService: TaskQueueService,
	) {
		super(TaskQueueProcessor.name);
	}

	@Process(Tasks.PUBLISH_POST)
	async handlePostPublish(job: Job<PublishPostJobData>) {
		const { profileId, postId } = job.data;
		await this.postsService.publishPost(profileId, postId);
		const status = await this.queueService.getPostStatus(postId);

		this.logger.log(
			`Job queued for post ${postId} and profile ${profileId} has been finished. Status: ${status}`,
		);
	}
}
