// src/services/linkedin.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/prisma.service';
import { encryptToken } from './util/crypto';

@Injectable()
export class LinkedInService {
  constructor(private readonly prisma: PrismaService) { }

  async linkAccount(profileId: number, accessToken: string, refreshToken?: string) {
    const encryptedAccessToken = encryptToken(accessToken);
    await this.prisma.socialAccount.upsert({
      where: {
        provider_profileId: {
          provider: 'linkedin',
          profileId: profileId,
        },
      },
      update: {
        encryptedAccessToken,
        refreshToken,
        updatedAt: new Date(),
      },
      create: {
        provider: 'linkedin',
        encryptedAccessToken,
        refreshToken,
        profileId: profileId,
      },
    });
  }
}
