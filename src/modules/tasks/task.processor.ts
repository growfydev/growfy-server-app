import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { PostsService } from '../posts/posts.service'
import { Logger } from '@nestjs/common';

@Processor('taskQueue')
export class TaskQueueProcessor {
    private logger = new Logger()
    constructor(private readonly postsService: PostsService) { }

    @Process('publishPost')
    async handlePostPublish(job: Job) {
        const { profileId, postId } = job.data;
        await this.postsService.publishPost(profileId, postId);
        this.logger.log(`Post ${postId} for profile ${profileId} published.`);
    }
}
