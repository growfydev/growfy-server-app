import { Injectable, UnauthorizedException, BadRequestException } from "@nestjs/common";
import { AuthenticateDto, TokensDto } from "../types/dto";
import { comparePasswords } from "../utils/crypt";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt";
import { MemberService } from "./member.service";
import { TwoFactorAuthService } from "./two-factor-auth.service";
import { UserService } from "./users.service";

@Injectable()
export class AuthenticationService {
    constructor(
        private userService: UserService,
        private twoFactorAuthService: TwoFactorAuthService,
        private memberService: MemberService
    ) { }

    async authenticate(dto: AuthenticateDto): Promise<TokensDto> {
        const { email, password, token2FA } = dto;

        const user = await this.userService.findUserByEmail(email);
        if (!user) throw new UnauthorizedException('Invalid credentials');

        const isPasswordValid = await comparePasswords(password, user.password);
        if (!isPasswordValid) throw new UnauthorizedException('Invalid credentials');

        if (user.otpEnabled) {
            if (!token2FA) throw new BadRequestException('The 2FA Token is Missing');
            const is2FATokenValid = await this.twoFactorAuthService.verify2FAToken(user.id, token2FA);
            if (!is2FATokenValid) throw new BadRequestException('Invalid 2FA token');
        }

        const profiles = await this.memberService.getUserProfilesAndRoles(user.id);

        const JwtPayload = {
            id: user.id,
            role: user.role as string,
            profiles: profiles.map((profile) => ({
                id: profile.id,
                roles: profile.role as string,
                permissions: profile.permissions,
            })),
        };

        const accessToken = generateAccessToken(JwtPayload);
        const refreshToken = generateRefreshToken(user.id);

        return { accessToken, refreshToken };
    }

}
