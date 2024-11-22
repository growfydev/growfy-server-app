import { Injectable, BadRequestException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { GlobalStatus, TeamRole, User } from '@prisma/client';
import { hashPassword, comparePasswords } from 'src/modules/auth/utils/crypt';
import { generateAccessToken, generateRefreshToken } from 'src/modules/auth/utils/jwt';
import { PrismaService } from 'src/core/prisma.service';
import { AuthenticateDto, CompleteRegistrationDto, RegisterDto, TokensDto } from './types/dto';
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


    let userWithDetails: User;

    if (data.nameProfile) {
      const profile = await this.createProfile(data.nameProfile, newUser.id);
      await this.createMember(newUser.id, profile.id, TeamRole.MANAGER);

      userWithDetails = await this.prisma.user.findUnique({
        where: { id: newUser.id },
        include: {
          members: {
            include: { profile: true },
          },
        },
      });
    } else {
      userWithDetails = await this.prisma.user.findUnique({
        where: { id: newUser.id },
      });
    }

    return { user: userWithDetails };
  }

  async completeRegistration(email: string, dto: CompleteRegistrationDto): Promise<{ user: User }> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || user.globalStatus !== GlobalStatus.INACTIVE) {
      throw new BadRequestException('No se encontró un usuario pendiente de activación.');
    }

    const updatedUser = await this.prisma.user.update({
      where: { email },
      data: {
        name: dto.name,
        phone: dto.phone,
        password: await hashPassword(dto.password),
        globalStatus: GlobalStatus.ACTIVE,
      },
    });

    return { user: updatedUser };
  }


  async createProfile(name: string, userId: number) {
    return this.prisma.profile.create({
      data: {
        name,
        userId,
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

  async authenticate(authenticateDto: AuthenticateDto): Promise<TokensDto> {
    const { email, password, token2FA } = authenticateDto;

    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        otpEnabled: true,
        role: true,
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

    const profilePermissions = await Promise.all(
      user.members.map(async (member) => {
        const permissions = await this.prisma.teamRolePermission.findMany({
          where: { teamRole: member.role },
          select: { permission: { select: { name: true } } },
        });
        return {
          profileId: member.profile.id,
          profileName: member.profile.name,
          memberRole: member.role,
          permissions: permissions.map((p) => p.permission.name),
        };
      })
    );

    const userRoles = {
      userRole: user.role,
      profiles: profilePermissions,
    };

    const accessToken = generateAccessToken(user.id, userRoles);
    const refreshToken = generateRefreshToken(user.id);

    return { accessToken, refreshToken };
  }

  async getProfile(userId: number): Promise<{ user: User }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        members: {
          include: { profile: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return { user: user };
  }
}
