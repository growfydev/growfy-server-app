import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma.service';
import { CreatePostDto } from './dtos/create-post.dto';
import { TaskQueueService } from '../tasks/tasks-queue.service';
import { GlobalStatus, PostStatus, TaskStatus } from '@prisma/client';
import { Service } from 'src/service';

@Injectable()
export class PostsService extends Service {
  constructor(private readonly prisma: PrismaService, private readonly taskQueueService: TaskQueueService) {
    super();
  }

  async createPost(postData: CreatePostDto, profileId: number) {
    const { typePost, provider, content, status, unix } = postData;

    const postType = await this.prisma.postType.findFirst({
      where: { name: typePost },
    });
    if (!postType) {
      throw new Error(`Tipo de post "${typePost}" no encontrado.`);
    }

    const providerData = await this.prisma.provider.findFirst({
      where: { name: provider },
    });
    if (!providerData) {
      throw new Error(`Proveedor "${provider}" no encontrado.`);
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
        `El tipo de post "${typePost}" no es compatible con el proveedor "${provider}".`,
      );
    }

    const requiredFields = postType.fields as Record<string, string>;
    for (const [field, fieldType] of Object.entries(requiredFields)) {
      if (!(field in content)) {
        throw new Error(
          `El campo "${field}" es requerido para el tipo de post "${typePost}".`,
        );
      }

      if (typeof content[field] !== fieldType) {
        throw new Error(
          `El campo "${field}" debe ser de tipo "${fieldType}", pero se recibió "${typeof content[field]}".`,
        );
      }
    }

    if (!profileId) {
      throw new Error(
        `No se encontró un perfil asociado al proveedor "${provider}".`,
      );
    }

    const newPost = await this.prisma.post.create({
      data: {
        status: status,
        postTypeId: postType.id,
        profileId: profileId,
        fields: content,
        globalStatus: GlobalStatus.ACTIVE,
        task: unix
          ? {
            create: { status: TaskStatus.PENDING, unix },
          }
          : undefined,
      },
    });

    if (unix) {
      await this.taskQueueService.scheduleTask(profileId, newPost.id, unix);
    }

    return newPost;
  }

  async getPostsByProfile(profileId: number) {
    return this.prisma.profile.findUnique({
      where: {
        id: profileId,
      },
      include: {
        posts: {
          include: {
            task: true,
            postType: true,
            profile: {
              include: {
                socials: {
                  include: {
                    provider: true,
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
    const post = await this.prisma.post.findFirst({
      where: { id: postId, profileId },
      include: { task: true },
    });

    if (!post) {
      throw new Error(`Post with ID ${postId} not found for profile ${profileId}.`);
    }

    await this.prisma.post.update({
      where: { id: postId },
      data: { globalStatus: GlobalStatus.ACTIVE, status: PostStatus.PUBLISHED },
    });

    this.logger.log(`Post ${postId} has been published.`);
  }
}
