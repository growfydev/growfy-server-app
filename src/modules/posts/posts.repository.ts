import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma.service';

@Injectable()
export class PostsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findPostTypeByName(name: string) {
    return this.prisma.postType.findFirst({ where: { name } });
  }

  async findProviderByName(name: string) {
    return this.prisma.provider.findFirst({ where: { name } });
  }

  async findProfileByProvider(providerId: number) {
    return this.prisma.profile.findFirst({
      where: { socials: { some: { providerId } } },
    });
  }

  async createPost(data: any) {
    return this.prisma.post.create({ data });
  }
}
