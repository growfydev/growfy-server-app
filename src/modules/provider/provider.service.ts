import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/prisma.service';

@Injectable()
export class ProviderService {
  constructor(private readonly prisma: PrismaService) {}

  async getProviderByName(providerName: string) {
    try {
      const provider = await this.prisma.provider.findFirst({
        where: { name: providerName },
        include: {
          ProviderPostType: {
            include: {
              posttype: true,
            },
          },
        },
      });

      if (!provider) {
        throw new Error(`Provider ${providerName} not found`);
      }

      return provider;
    } catch (error) {
      console.error('Error searching for provider:', error);
      throw new Error('There was an error when searching for the provider.');
    }
  }
}
