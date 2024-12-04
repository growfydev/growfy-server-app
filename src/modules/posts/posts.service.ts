import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma.service';
import { CreatePostDto } from './dtos/create-post.dto';
import { TaskQueueService } from '../tasks/tasks-queue.service';
import { GlobalStatus, PostStatus, TaskStatus } from '@prisma/client';
import { Service } from 'src/service';
import { ExportPostsDto } from './dtos/export-posts.dto';
import { ExportFactory } from './exporter/export.factory';
import { PostFactorySelector } from '../socials/common/post-factory/post.selector.factory';

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
      const post = await this.prisma.post.findUnique({
        where: {
          id: postId,
        },
        include: {
          profile: {
            select: {
              socials: {
                select: {
                  providerId: true,
                  token: true,
                  accountId: true,
                },
              },
            },
          },
          ProviderPostType: {
            include: {
              provider: {
                select: {
                  name: true,
                  id: true,
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
      });

      if (!post || !post.ProviderPostType) {
        throw new Error('Post not found');
      }

      const typePostName = post.ProviderPostType.posttype.name;
      const provider = post.ProviderPostType.provider;
      const accountId = post.profile.socials.find(
        (social) => social.providerId === provider.id,
      ).accountId;
      const token = post.profile.socials.find(
        (social) => social.providerId === provider.id,
      ).token;
      const fields = post.fields;

      const factory = PostFactorySelector.getFactory(provider.name);
      const publisher = factory.createPublisher();
      await publisher.publish(accountId, token, typePostName, fields);

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

  async exportPosts(
    profileId: number,
    exportPostsDto: ExportPostsDto,
  ): Promise<{ fileBuffer: any; header: any }> {
    const { startDate, endDate, providerIds, formatId } = exportPostsDto;

    const start = new Date(startDate);
    start.setUTCHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setUTCHours(23, 59, 59, 999);

    const format = await this.prisma.exportFormat.findUnique({
      where: { id: formatId },
    });

    if (!format) {
      throw new Error('Formato no encontrado');
    }

    const posts = await this.prisma.post.findMany({
      where: {
        profileId,
        createdAt: {
          gte: start,
          lte: end,
        },
        ...(providerIds !== undefined && providerIds.length > 0
          ? { ProviderPostType: { providerId: { in: providerIds } } }
          : providerIds?.length === 0
            ? { ProviderPostType: { providerId: { in: [] } } }
            : {}),
      },
      include: {
        ProviderPostType: {
          include: {
            provider: true,
            posttype: true,
          },
        },
        profile: true,
        task: true,
        PostType: true,
      },
    });

    if (!posts.length) {
      throw new Error(
        'No se encontraron publicaciones en el rango de fechas especificado.',
      );
    }

    // Transformar los posts a un formato más fácil de mapear y guardar
    const transformedPosts = posts.map((post) => ({
      id: post.id,
      content: post.fields,
      postTypeId: post.postTypeId,
      provider: post.ProviderPostType?.provider.name,
      postType: post.ProviderPostType?.posttype.name,
      profileName: post.profile?.name,
      taskStatus: post.task?.status,
      taskUnix: post.task?.unix,
    }));

    // Registrar la exportación con los datos transformados
    await this.prisma.export.create({
      data: {
        startDate: start,
        endDate: end,
        posts: transformedPosts, // Almacenar los datos de los posts de forma más estructurada
        format: format.format, // Almacenar el formato de exportación
      },
    });

    // Exportar según el formato
    const exporter = ExportFactory.getExporter(format.format);
    return exporter.export(posts);
  }
}
