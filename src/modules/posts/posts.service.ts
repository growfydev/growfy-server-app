import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma.service';
import { CreatePostDto } from './dtos/create-post.dto';

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  async createPost(postData: CreatePostDto) {
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

    const profile = await this.prisma.profile.findFirst({
      where: {
        socials: {
          some: {
            providerId: providerData.id,
          },
        },
      },
    });
    if (!profile) {
      throw new Error(
        `No se encontró un perfil asociado al proveedor "${provider}".`,
      );
    }

    let taskData = null;
    if (unix) {
      taskData = {
        create: {
          status: 'PENDING',
          unix,
        },
      };
    }

    const newPost = await this.prisma.post.create({
      data: {
        status: status || 'DRAFT',
        postTypeId: postType.id,
        profileId: profile.id,
        fields: content,
        globalStatus: 'ACTIVE',
        task: taskData,
      },
    });

    return newPost;
  }
}