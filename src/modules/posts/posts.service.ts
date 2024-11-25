import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma.service';
import { CreatePostDto } from './dtos/create-post.dto';

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

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
        profileId: profileId,
        fields: content,
        globalStatus: 'ACTIVE',
        task: taskData,
      },
    });

    return newPost;
  }

  async getPostsByProfile(profileId: number) {
    return this.prisma.profile.findUnique({
      where: {
        id: profileId, // Reemplaza con el ID del perfil que deseas consultar
      },
      include: {
        posts: {
          include: {
            task: true, // Incluye la información de la tarea asociada al post
            postType: true, // Incluye el tipo de post
            profile: {
              include: {
                socials: {
                  include: {
                    provider: true, // Incluye el proveedor asociado
                  },
                },
              },
            },
          },
        },
      },
    });
  }
}
