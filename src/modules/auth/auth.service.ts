import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { Profile, User } from '@prisma/client';
import { hashPassword, comparePasswords } from 'src/modules/auth/utils/crypt';
import { generateAccessToken, generateRefreshToken } from 'src/modules/auth/utils/jwt';
import { PrismaService } from 'src/core/prisma.service';
import { AuthenticateDto, RegisterDto, TokensDto } from './dto';
import { TwoFactorAuthService } from './two-factor-auth.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private readonly twoFactorAuthService: TwoFactorAuthService
  ) { }

  async register(data: RegisterDto): Promise<{ user: User; profile: Profile }> {
    const newUser = await this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: await hashPassword(data.password),
      },
    });

    const profile = await this.createProfile(data.name, newUser.id);

    return { user: newUser, profile };
  }

  async createProfile(name: string, userId: number) {
    return this.prisma.profile.create({
      data: {
        name,
        userId
      }
    })
  }

  async authenticate(authenticateDto: AuthenticateDto): Promise<TokensDto> {
    const { email, password, token2FA } = authenticateDto;

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await comparePasswords(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.otpEnabled) {
      if (!token2FA) {
        throw new BadRequestException('The 2FA Token is Missing')
      }
      const is2FATokenValid = await this.twoFactorAuthService.verify2FAToken(user.id, token2FA);
      if (!is2FATokenValid) {
        throw new BadRequestException('Invalid 2FA token');
      }
    }

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    return { accessToken, refreshToken };
  }
}
