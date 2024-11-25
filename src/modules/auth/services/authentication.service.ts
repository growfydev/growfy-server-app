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

    // Step 1: Validate user credentials
    const user = await this.userService.findUserByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isPasswordValid = await comparePasswords(password, user.password);
    if (!isPasswordValid)
      throw new UnauthorizedException('Invalid credentials');

    // Step 2: Handle 2FA if enabled
    if (user.otpEnabled) {
      if (!token2FA) throw new BadRequestException('The 2FA Token is missing');
      const is2FATokenValid = await this.twoFactorAuthService.verify2FAToken(
        user.id,
        token2FA,
      );
      if (!is2FATokenValid) throw new BadRequestException('Invalid 2FA token');
    }

    // Step 3: Retrieve user's profiles, roles, and permissions
    const profiles = await this.memberService.getUserProfilesAndRoles(user.id);

    // Step 4: Construct the JWT payload

    const jwtPayload: {
      id: number;
      role: Role; // Role as an enum
      profiles: {
        id: number;
        roles: ProfileMemberRoles[]; // ProfileMemberRoles as an enum
        permissions: string[];
      }[];
    } = {
      id: user.id,
      role: user.role as Role, // Ensure role is of type Role
      profiles: profiles.map((profile) => ({
        id: profile.id,
        roles: profile.roles.map((role) => role as ProfileMemberRoles), // Ensure roles are of type ProfileMemberRoles
        permissions: profile.permissions,
      })),
    };


    // Step 5: Generate access and refresh tokens
    const accessToken = generateAccessToken(jwtPayload);
    const refreshToken = generateRefreshToken(user.id);

    // Return tokens to the client
    return { accessToken, refreshToken };
  }
}
