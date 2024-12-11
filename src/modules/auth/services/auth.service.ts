import {
	Injectable,
	BadRequestException,
	NotFoundException,
} from '@nestjs/common';
import { User, GlobalStatus, ProfileMemberRoles } from '@prisma/client';
import {
	RegisterDto,
	CompleteRegistrationDto,
	AuthenticateDto,
	TokensDto,
} from '../types/dto';
import { hashPassword } from '../utils/crypt';
import { AuthenticationService } from './authentication.service';
import { MemberService } from './member.service';
import { ProfileService } from './profile.service';
import { UserService } from './users.service';
import * as jwt from 'jsonwebtoken';
import configLoader from 'src/lib/ConfigLoader';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';

const REFRESH_SECRET_KEY = configLoader().jwt.refresh_key;

@Injectable()
export class AuthService {
	constructor(
		private userService: UserService,
		private profileService: ProfileService,
		private memberService: MemberService,
		private authenticationService: AuthenticationService,
	) {}

	async register(data: RegisterDto): Promise<{ user: User }> {
		const newUser = await this.userService.createUser(data);

		if (data.nameProfile) {
			const profile = await this.profileService.createProfile(
				data.nameProfile,
				newUser.id,
			);

			const member = await this.memberService.createMember(
				newUser.id,
				profile.id,
			);

			// Assign the OWNER role to the newly created member
			await this.memberService.assignRole(
				member.id,
				ProfileMemberRoles.OWNER,
			);
		}

		return { user: newUser };
	}

	async completeRegistration(
		email: string,
		dto: CompleteRegistrationDto,
	): Promise<{ user: User }> {
		const user = await this.userService.findUserByEmail(email);
		if (!user || user.globalStatus !== GlobalStatus.INACTIVE) {
			throw new BadRequestException(
				'No user found with pending activation.',
			);
		}

		const updatedUser = await this.userService.updateUser(email, {
			name: dto.name,
			phone: dto.phone,
			password: await hashPassword(dto.password),
			globalStatus: GlobalStatus.ACTIVE,
		});

		return { user: updatedUser };
	}

	async getUser(userId: number): Promise<{ user: User }> {
		const user = await this.userService.findUserById(userId);
		if (!user) throw new NotFoundException('User not found');
		return { user };
	}

	async authenticate(dto: AuthenticateDto): Promise<TokensDto> {
		return this.authenticationService.authenticate(dto);
	}

	async refreshToken(refreshToken: string): Promise<TokensDto> {
		try {
			const decoded = jwt.verify(refreshToken, REFRESH_SECRET_KEY) as {
				userId: number;
				fingerprint?: string;
			};

			const user = await this.userService.findUserById(decoded.userId);
			if (!user) throw new NotFoundException('User not found');

			const jwtPayload =
				await this.authenticationService.createJwtPayload(user);
			const accessToken = generateAccessToken(jwtPayload);
			const newRefreshToken = generateRefreshToken(
				user.id,
				decoded.fingerprint,
			);

			return { accessToken, refreshToken: newRefreshToken, user };
		} catch (error) {
			throw new BadRequestException('Invalid refresh token', error);
		}
	}

	async getUserProfiles(userId: number) {
		// Retrieve user profiles along with their roles and permissions
		const profiles =
			await this.memberService.getUserProfilesAndRoles(userId);

		if (!profiles || profiles.length === 0) {
			throw new NotFoundException(
				`No profiles found for user ID ${userId}`,
			);
		}

		return profiles.map((profile) => ({
			id: profile.id,
			name: profile.name,
			roles: profile.roles, // Array of roles for the profile
			permissions: profile.permissions, // Array of aggregated permissions for the roles
		}));
	}
}
