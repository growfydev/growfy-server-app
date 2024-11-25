import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { AuthenticateDto, TokensDto } from '../types/dto';
import { comparePasswords } from '../utils/crypt';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';
import { MemberService } from './member.service';
import { TwoFactorAuthService } from './two-factor-auth.service';
import { UserService } from './users.service';
import { Role, ProfileMemberRoles } from '@prisma/client';

@Injectable()
export class AuthenticationService {
  constructor(
    private readonly userService: UserService,
    private readonly twoFactorAuthService: TwoFactorAuthService,
    private readonly memberService: MemberService,
  ) { }

  async authenticate(dto: AuthenticateDto): Promise<TokensDto> {
    const { email, password, token2FA } = dto;

    const user = await this.userService.findUserByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isPasswordValid = await comparePasswords(password, user.password);
    if (!isPasswordValid)
      throw new UnauthorizedException('Invalid credentials');

    if (user.otpEnabled) {
      if (!token2FA) throw new BadRequestException('The 2FA Token is missing');
      const is2FATokenValid = await this.twoFactorAuthService.verify2FAToken(
        user.id,
        token2FA,
      );
      if (!is2FATokenValid) throw new BadRequestException('Invalid 2FA token');
    }


    const profiles = await this.memberService.getUserProfilesAndRoles(user.id);

    const jwtPayload: {
      id: number;
      role: Role;
      profiles: {
        id: number;
        roles: ProfileMemberRoles[];
        permissions: string[];
      }[];
    } = {
      id: user.id,
      role: user.role as Role,
      profiles: profiles.map((profile) => ({
        id: profile.id,
        roles: profile.roles.map((role) => role as ProfileMemberRoles),
        permissions: profile.permissions,
      })),
    };


    const accessToken = generateAccessToken(jwtPayload);
    const refreshToken = generateRefreshToken(user.id);

    return { accessToken, refreshToken };
  }
}
