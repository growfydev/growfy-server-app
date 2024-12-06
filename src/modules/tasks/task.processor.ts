import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { PostsService } from '../posts/posts.service';
import { PrismaService } from 'src/core/prisma.service';
import { Service as ProcessorService } from 'src/service';

@Processor('taskQueue')
export class TaskQueueProcessor extends ProcessorService {
	constructor(
		private readonly postsService: PostsService,
		private readonly prisma: PrismaService,
	) {
		super(TaskQueueProcessor.name);
	}

	@Process('publishPost')
	async handlePostPublish(job: Job) {
		const { profileId, postId } = job.data;
		await this.postsService.publishPost(profileId, postId);
		const status = await this.getPostStatus(postId);
		this.logger.log(
			`Job queued for post ${postId} and profile ${profileId} has been finished. Status: ${status}`,
		);
	}

	async getPostStatus(id: number) {
		return await this.prisma.post.findUnique({
			where: {
				id: id,
			},
			select: {
				status: true,
			},
		});
	}
}
