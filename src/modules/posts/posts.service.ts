import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma.service';
import { CreatePostDto } from './dtos/create-post.dto';
import { TaskQueueService } from '../tasks/tasks-queue.service';
import { GlobalStatus, PostStatus, TaskStatus } from '@prisma/client';
import { Service } from 'src/service';

@Injectable()
export class PostsService extends Service {
  constructor(
    private readonly prisma: PrismaService,
    private readonly taskQueueService: TaskQueueService,
  ) {
    super();
  }

  async createPost(postData: CreatePostDto, profileId: number) {
    const { typePost, provider, content, unix } = postData;

    try {
      const postType = await this.prisma.postType.findUnique({
        where: { id: typePost },
      });
      if (!postType) {
        throw new Error(`Post type "${typePost}" not found.`);
      }

      const providerData = await this.prisma.provider.findUnique({
        where: { id: provider },
      });
      if (!providerData) {
        throw new Error(`Provider "${provider}" not found.`);
      }

      const isValidProviderPostType =
        await this.prisma.providerPostType.findFirst({
          where: {
            providerId: providerData.id,
            posttypeId: postType.id,
          },
        });
      if (!isValidProviderPostType) {
        throw new Error(
          `The type of post "${typePost}" is not supported by the supplier "${provider}".`,
        );
      }

      const requiredFields = postType.fields as Record<string, string>;
      for (const [field, fieldType] of Object.entries(requiredFields)) {
        if (!(field in content)) {
          throw new Error(
            `The field "${field}" is required for the type of post "${typePost}".`,
          );
        }

        if (typeof content[field] !== fieldType) {
          throw new Error(
            `The field "${field}" must be of type "${fieldType}", but received "${typeof content[field]}".`,
          );
        }
      }

      if (!profileId) {
        throw new Error(
          `No profile associated with the provider "${provider}".`,
        );
      }

      const postStatus = unix ? PostStatus.QUEUED : PostStatus.PUBLISHED;
      const taskStatus = unix ? TaskStatus.PENDING : TaskStatus.COMPLETED;
      const unixCurrentTimestamp = Math.floor(new Date().getTime() / 1000);

      const newPost = await this.prisma.post.create({
        data: {
          status: postStatus,
          postTypeId: postType.id,
          providerPostTypeId: isValidProviderPostType.id,
          profileId,
          fields: content,
          globalStatus: GlobalStatus.ACTIVE,
          task: unix
            ? { create: { status: taskStatus, unix } }
            : { create: { status: taskStatus, unix: unixCurrentTimestamp } },
        },
        include: {
          ProviderPostType: {
            include: {
              provider: {
                select: {
                  name: true,
                },
              },
              posttype: {
                select: {
                  name: true,
                  fields: true,
                },
              },
            },
          },
          task: { select: { status: true, unix: true } },
        },
      });

      if (unix) {
        await this.taskQueueService.scheduleTask(profileId, newPost.id, unix);
      }

      return newPost;
    } catch (error) {
      console.error('Error creating post:', error);
      throw new Error('There was an error creating the post.');
    }
  }

  async getPostsByProfile(profileId: number) {
    return this.prisma.profile.findUnique({
      where: {
        id: profileId,
      },
      include: {
        posts: {
          include: {
            task: {
              select: {
                status: true,
                unix: true,
              },
            },
            ProviderPostType: {
              include: {
                provider: {
                  select: {
                    name: true,
                  },
                },
                posttype: {
                  select: {
                    name: true,
                    fields: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async publishPost(profileId: number, postId: number): Promise<void> {
    try {
      await this.update(profileId, postId);
    } catch (error) {
      await this.prisma.post.update({
        where: { id: postId },
        data: { status: PostStatus.FAILED },
      });

      await this.prisma.task.updateMany({
        where: { postId },
        data: { status: TaskStatus.FAILED },
      });
    }
  }

  async update(profileId: number, postId: number) {
    const post = await this.prisma.post.findFirst({
      where: { id: postId, profileId },
      include: { task: true },
    });

    if (!post) {
      throw new Error(
        `Post with ID ${postId} not found for profile ${profileId}.`,
      );
    }

    await this.prisma.post.update({
      where: { id: postId },
      data: { globalStatus: GlobalStatus.ACTIVE, status: PostStatus.PUBLISHED },
    });

    if (post.task) {
      await this.prisma.task.update({
        where: { id: post.task.id },
        data: { status: TaskStatus.COMPLETED },
      });
    }

    this.logger.log(`Post ${postId} has been published.`);
  }
}
