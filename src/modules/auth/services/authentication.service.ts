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
import { Role, User } from '@prisma/client';
import { UserJWTCreatePayloadType } from '../types/auth';

@Injectable()
export class AuthenticationService {
	constructor(
		private readonly userService: UserService,
		private readonly twoFactorAuthService: TwoFactorAuthService,
		private readonly memberService: MemberService,
	) {}

	async authenticate(params: AuthenticateDto): Promise<TokensDto> {
		const user = await this.validateUser(params.email, params.password);
		if (user.otpEnabled) {
			await this.validateTwoFactorAuth(user.id, params.token2FA);
		}

		const jwtPayload = await this.createJwtPayload(user);
		const accessToken = generateAccessToken(jwtPayload);
		const refreshToken = generateRefreshToken(user.id);

		return { accessToken, refreshToken };
	}

	private async validateUser(email: string, password: string): Promise<User> {
		const user = await this.userService.findUserByEmail(email);
		if (!user) throw new UnauthorizedException('Invalid credentials');

		const isPasswordValid = await comparePasswords(password, user.password);
		if (!isPasswordValid)
			throw new UnauthorizedException('Invalid credentials');

		return user;
	}

	private async validateTwoFactorAuth(
		userId: number,
		token2FA: string,
	): Promise<void> {
		if (!token2FA)
			throw new BadRequestException('The 2FA Token is missing');

		const is2FATokenValid = await this.twoFactorAuthService.verify2FAToken(
			userId,
			token2FA,
		);
		if (!is2FATokenValid)
			throw new BadRequestException('Invalid 2FA token');
	}

	public async createJwtPayload(
		user: User,
	): Promise<UserJWTCreatePayloadType> {
		return {
			id: user.id,
			role: user.role as Role,
		};
	}
}
