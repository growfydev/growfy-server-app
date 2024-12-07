import {
	Injectable,
	BadRequestException,
	NotFoundException,
} from '@nestjs/common';
import { User, ProfileMemberRoles, GlobalStatus } from '@prisma/client';
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
			await this.memberService.createMember(
				newUser.id,
				profile.id,
				ProfileMemberRoles.MANAGER,
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
}
