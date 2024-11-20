import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { CoreRole, Member, Profile, TeamRole, User } from '@prisma/client';
import { hashPassword, comparePasswords } from 'src/modules/auth/utils/crypt';
import { generateAccessToken, generateRefreshToken } from 'src/modules/auth/utils/jwt';
import { PrismaService } from 'src/core/prisma.service';
import { AuthenticateDto, RegisterDto, TokensDto } from './types/dto';
import { TwoFactorAuthService } from './two-factor-auth.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private readonly twoFactorAuthService: TwoFactorAuthService
  ) { }

  async register(data: RegisterDto): Promise<{ user: User }> {
    const newUser = await this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: await hashPassword(data.password),
      },
    });

    const profile = await this.createProfile(data.nameProfile, newUser.id);
    await this.createMember(newUser.id, profile.id, TeamRole.MANAGER);
    await this.assignCoreRolePermissions(newUser.role);
    await this.assignTeamRolePermissions(TeamRole.MANAGER);

    const userWithDetails = await this.prisma.user.findUnique({
      where: { id: newUser.id },
      include: {
        members: {
          include: { profile: true },
        },
      },
    });

    return { user: userWithDetails };
  }


  async createProfile(name: string, userId: number) {
    return this.prisma.profile.create({
      data: {
        name,
      },
    });
  }

  async createMember(userId: number, profileId: number, role: TeamRole) {
    return this.prisma.member.create({
      data: {
        userId,
        profileId,
        role,
      },
    });
  }

  async assignCoreRolePermissions(role: CoreRole) {
    const existingPermissions = await this.prisma.coreRolePermission.findMany({
      where: { coreRole: role },
      select: { permissionId: true },
    });

    const existingPermissionIds = new Set(existingPermissions.map((p) => p.permissionId));

    const corePermissions = await this.prisma.permission.findMany({
      where: { roles: { some: { coreRole: role } } },
    });

    for (const permission of corePermissions) {
      if (!existingPermissionIds.has(permission.id)) {
        await this.prisma.coreRolePermission.create({
          data: {
            coreRole: role,
            permissionId: permission.id,
          },
        });
      }
    }
  }


  async assignTeamRolePermissions(role: TeamRole) {
    const existingPermissions = await this.prisma.teamRolePermission.findMany({
      where: { teamRole: role },
      select: { permissionId: true },
    });

    const existingPermissionIds = new Set(existingPermissions.map((p) => p.permissionId));

    const teamPermissions = await this.prisma.permission.findMany({
      where: { teamRoles: { some: { teamRole: role } } },
    });

    for (const permission of teamPermissions) {
      if (!existingPermissionIds.has(permission.id)) {
        await this.prisma.teamRolePermission.create({
          data: {
            teamRole: role,
            permissionId: permission.id,
          },
        });
      }
    }
  }


  async authenticate(authenticateDto: AuthenticateDto): Promise<TokensDto> {
    const { email, password, token2FA } = authenticateDto;

    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        role: true,
        otpEnabled: true,
        members: {
          select: {
            role: true,
            profile: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await comparePasswords(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.otpEnabled) {
      if (!token2FA) {
        throw new BadRequestException('The 2FA Token is Missing');
      }
      const is2FATokenValid = await this.twoFactorAuthService.verify2FAToken(user.id, token2FA);
      if (!is2FATokenValid) {
        throw new BadRequestException('Invalid 2FA token');
      }
    }

    const corePermissions = await this.prisma.coreRolePermission.findMany({
      where: { coreRole: user.role },
      select: { permission: true },
    });

    const teamPermissions = await this.prisma.teamRolePermission.findMany({
      where: {
        teamRole: { in: user.members.map((member) => member.role) },
      },
      select: { permission: true },
    });

    const permissions = [
      ...corePermissions.map((p) => p.permission.name),
      ...teamPermissions.map((p) => p.permission.name),
    ];

    const userRoles = {
      userRole: user.role,
      profiles: user.members.map((member) => ({
        profileId: member.profile.id,
        profileName: member.profile.name,
        memberRole: member.role,
      })),
      permissions,
    };

    const accessToken = generateAccessToken(user.id, userRoles);
    const refreshToken = generateRefreshToken(user.id);

    return { accessToken, refreshToken };
  }
}
