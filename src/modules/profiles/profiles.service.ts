import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/core/prisma.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Profile, GlobalStatus, CoreRole, TeamRole, Member, User } from '@prisma/client';
import { InviteUserDto } from './dto/invite-user.dto';
import { configLoader } from 'src/lib/config.loader';

@Injectable()
export class ProfilesService {
  constructor(private readonly prisma: PrismaService) { }

  async create(userId: number, createProfileDto: CreateProfileDto): Promise<{ profile: Profile }> {
    const { name } = createProfileDto;

    if (!name) {
      throw new BadRequestException('Name is required');
    }

    const profile = await this.prisma.profile.create({
      data: { name, userId },
    });

    await this.prisma.member.create({
      data: {
        userId,
        profileId: profile.id,
        role: TeamRole.MANAGER,
      },
    })

    return { profile };
  }

  async findAll(): Promise<{ profiles: Profile[] }> {
    const profiles = await this.prisma.profile.findMany({
      where: { globalStatus: GlobalStatus.ACTIVE },
    });

    return { profiles };
  }

  async findOne(id: number): Promise<{ profile: Profile }> {
    const profile = await this.prisma.profile.findUnique({
      where: { id },
    });

    if (!profile) {
      throw new NotFoundException(`Profile with ID ${id} not found`);
    }

    return { profile };
  }

  async update(id: number, updateProfileDto: UpdateProfileDto): Promise<{ profile: Profile }> {
    const profile = await this.prisma.profile.findUnique({ where: { id } });

    if (!profile) {
      throw new NotFoundException(`Profile with ID ${id} not found`);
    }

    const updatedProfile = await this.prisma.profile.update({
      where: { id },
      data: updateProfileDto,
    });

    return { profile: updatedProfile };
  }

  async remove(id: number): Promise<{ profile: Profile }> {
    const profile = await this.prisma.profile.findUnique({ where: { id } });

    if (!profile) {
      throw new NotFoundException(`Profile with ID ${id} not found`);
    }

    const deletedProfile = await this.prisma.profile.update({
      where: { id },
      data: { globalStatus: GlobalStatus.DELETED },
    });

    return { profile: deletedProfile };
  }

  async deactivate(id: number): Promise<{ profile: Profile }> {
    const profile = await this.prisma.profile.findUnique({ where: { id } });

    if (!profile) {
      throw new NotFoundException(`Profile with ID ${id} not found`);
    }

    const deactivatedProfile = await this.prisma.profile.update({
      where: { id },
      data: { globalStatus: GlobalStatus.INACTIVE },
    });

    return { profile: deactivatedProfile };
  }

  async activate(id: number): Promise<{ profile: Profile }> {
    const profile = await this.prisma.profile.findUnique({ where: { id } });

    if (!profile) {
      throw new NotFoundException(`Profile with ID ${id} not found`);
    }

    const activatedProfile = await this.prisma.profile.update({
      where: { id },
      data: { globalStatus: GlobalStatus.ACTIVE },
    });

    return { profile: activatedProfile };
  }

  async inviteUser(inviteUserDto: InviteUserDto): Promise<{ member: Member }> {
    const { email, profileId, role } = inviteUserDto;

    if (!Object.values(TeamRole).includes(role)) {
      throw new BadRequestException('Invalid role');
    }

    let invitedUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!invitedUser) {
      invitedUser = await this.prisma.user.create({
        data: {
          name: 'Pending User',
          email,
          password: '',
          role: CoreRole.USER,
          globalStatus: GlobalStatus.INACTIVE,
        },
      });

      // Opcional: Enviar correo de invitación
      console.log(`Invitation email sent to ${email}`);
      console.log(`Invitation link: ${configLoader().client_url}/complete-registration/?email=${email}`);
    }

    const isAlreadyMember = await this.prisma.member.findFirst({
      where: {
        userId: invitedUser.id,
        profileId,
      },
    });

    if (isAlreadyMember) {
      throw new BadRequestException('The user is already a member of this profile.');
    }

    const newMember = await this.prisma.member.create({
      data: {
        userId: invitedUser.id,
        profileId,
        role: role,
        globalStatus: GlobalStatus.ACTIVE,
      },
    })

    return { member: newMember };
  }
}
