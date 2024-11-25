import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { PostsService } from '../posts/posts.service'

@Processor('taskQueue')
export class TaskQueueProcessor {
    constructor(private readonly postsService: PostsService) { }

    @Process('publishPost')
    async handlePostPublish(job: Job) {
        const { profileId, postId } = job.data;
        await this.postsService.publishPost(profileId, postId);
        console.log(`Post ${postId} for profile ${profileId} published.`);
    }
}
