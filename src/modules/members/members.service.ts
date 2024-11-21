import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/core/prisma.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { Member, GlobalStatus, TeamRole } from '@prisma/client';

@Injectable()
export class MembersService {
  constructor(private readonly prisma: PrismaService) { }

  async create(createMemberDto: CreateMemberDto): Promise<{ member: Member }> {
    const { userId, profileId, role } = createMemberDto;

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const profile = await this.prisma.profile.findUnique({ where: { id: profileId } });

    if (!profile) {
      throw new BadRequestException('Profile not found');
    }

    if (!Object.values(TeamRole).includes(role)) {
      throw new BadRequestException('Invalid role');
    }

    const member = await this.prisma.member.create({
      data: {
        userId,
        profileId,
        role,
      },
      include: {
        user: true,
        profile: true,
      }
    });

    return { member };
  }

  async findAll(): Promise<{ members: Member[] }> {
    const members = await this.prisma.member.findMany({
      where: { globalStatus: GlobalStatus.ACTIVE },
      include: {
        user: true,
        profile: true,
      },
    });

    return { members };
  }

  async findOne(id: number): Promise<{ member: Member }> {
    const member = await this.prisma.member.findUnique({
      where: { id },
      include: {
        user: true,
        profile: true,
      },
    });

    if (!member) {
      throw new NotFoundException(`Member with ID ${id} not found`);
    }

    return { member };
  }

  async update(id: number, updateMemberDto: UpdateMemberDto): Promise<{ member: Member }> {
    const member = await this.prisma.member.findUnique({ where: { id } });
    if (!member) {
      throw new NotFoundException(`Member with ID ${id} not found`);
    }

    const memberUpdate = await this.prisma.member.update({
      where: { id },
      data: updateMemberDto,
    });

    return { member: memberUpdate };
  }

  async remove(id: number): Promise<{ member: Member }> {
    const member = await this.prisma.member.findUnique({ where: { id } });
    if (!member) {
      throw new NotFoundException(`Member with ID ${id} not found`);
    }

    const memeberDelete = await this.prisma.member.update({
      where: { id },
      data: {
        globalStatus: GlobalStatus.DELETED,
      },
    });

    return { member: memeberDelete };
  }

  async deactivate(id: number): Promise<{ member: Member }> {
    const member = await this.prisma.member.findUnique({ where: { id } });
    if (!member) {
      throw new NotFoundException(`Member with ID ${id} not found`);
    }

    const memberInactive = await this.prisma.member.update({
      where: { id },
      data: {
        globalStatus: GlobalStatus.INACTIVE,
      },
    });

    return { member: memberInactive };
  }

  async activate(id: number): Promise<{ member: Member }> {
    const member = await this.prisma.member.findUnique({ where: { id } });
    if (!member) {
      throw new NotFoundException(`Member with ID ${id} not found`);
    }

    const memberActive = await this.prisma.member.update({
      where: { id },
      data: {
        globalStatus: GlobalStatus.ACTIVE,
      },
    });

    return { member: memberActive };
  }
}
