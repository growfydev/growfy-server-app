import { Injectable } from '@nestjs/common';
import { Profile } from '@prisma/client';
import { PrismaService } from 'src/core/prisma.service';

@Injectable()
export class ProfileService {
  constructor(private prisma: PrismaService) { }

  async createProfile(name: string, userId: number): Promise<Profile> {
    return await this.prisma.profile.create(
      {
        data:
        {
          name,
          userId
        }
      }
    );
  }

  async findProfileById(profileId: number): Promise<Profile | null> {
    return await this.prisma.profile.findUnique(
      {
        where:
        {
          id: profileId
        }
      }
    );
  }
}
