import {
	Injectable,
	NotFoundException,
	BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/core/prisma.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import {
	Profile,
	GlobalStatus,
	Role,
	ProfileMemberRoles,
	Member,
} from '@prisma/client';
import { InviteUserDto } from './dto/invite-user.dto';
import configLoader from 'src/lib/ConfigLoader';
import { Service } from 'src/service';
import { EmailService } from '../email/email.service';

@Injectable()
export class ProfilesService extends Service {
	constructor(
		private readonly prisma: PrismaService,
		private readonly emailService: EmailService,
	) {
		super(ProfilesService.name);
	}

	/**
	 * Create a new profile and assign the creator as a manager.
	 */
	async create(
		userId: number,
		createProfileDto: CreateProfileDto,
	): Promise<{ member: Member }> {
		const { name } = createProfileDto;

		if (!name) {
			throw new BadRequestException('Name is required');
		}

		const profile = await this.prisma.profile.create({
			data: { name, userId },
		});

		// Create member and assign role
		const member = await this.prisma.member.create({
			data: {
				userId,
				profileId: profile.id,
			},
		});
		await this.assignRoleToMember(member.id, ProfileMemberRoles.OWNER);

		const updatedMember = await this.prisma.member.findUnique({
			where: { id: member.id },
			include: {
				profile: true,
				roles: true,
			},
		});

		return { member: updatedMember };
	}

	/**
	 * Assign a role to a member.
	 */
	private async assignRoleToMember(
		memberId: number,
		role: ProfileMemberRoles,
	) {
		await this.prisma.memberRole.create({
			data: {
				memberId,
				role,
			},
		});
	}

	/**
	 * Find all active profiles.
	 */
	async findAll(): Promise<{ profiles: Profile[] }> {
		const profiles = await this.prisma.profile.findMany({
			where: { globalStatus: GlobalStatus.ACTIVE },
		});

		return { profiles };
	}

	/**
	 * Find a profile by ID.
	 */
	async findOne(id: number): Promise<{ profile: Profile }> {
		const profile = await this.prisma.profile.findUnique({
			where: { id },
		});

		if (!profile) {
			throw new NotFoundException(`Profile with ID ${id} not found`);
		}

		return { profile };
	}

	/**
	 * Update a profile by ID.
	 */
	async update(
		id: number,
		updateProfileDto: UpdateProfileDto,
	): Promise<{ profile: Profile }> {
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

	/**
	 * Remove (soft delete) a profile by ID.
	 */
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

	/**
	 * Deactivate a profile by ID.
	 */
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

	/**
	 * Activate a profile by ID.
	 */
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

	/**
	 * Invite a user to a profile and assign a role.
	 */
	async inviteUser(
		inviteUserDto: InviteUserDto,
	): Promise<{ member: Member }> {
		const { email, profileId, roles } = inviteUserDto;

		if (!Array.isArray(roles) || roles.length === 0) {
			throw new BadRequestException('Roles must be a non-empty array');
		}

		for (const role of roles) {
			if (!Object.values(ProfileMemberRoles).includes(role)) {
				throw new BadRequestException(`Invalid role: ${role}`);
			}
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
					role: Role.USER,
					globalStatus: GlobalStatus.INACTIVE,
				},
			});

			await this.emailService
				.to(email)
				.subject('Invitation to Growfy')
				.html(
					`
					<p>You have been invited to join Growfy.</p>
					<p>Click <a href="${configLoader().client_url}/complete-registration/?email=${email}">here</a> to complete your registration.</p>
				`,
				)
				.send();
			this.logger.log(`Invitation email sent to ${email}`);
		}

		const isAlreadyMember = await this.prisma.member.findFirst({
			where: {
				userId: invitedUser.id,
				profileId,
			},
		});

		if (isAlreadyMember) {
			throw new BadRequestException(
				'The user is already a member of this profile.',
			);
		}

		const member = await this.prisma.member.create({
			data: {
				userId: invitedUser.id,
				profileId,
				globalStatus: GlobalStatus.ACTIVE,
			},
		});

		for (const role of roles) {
			await this.assignRoleToMember(member.id, role);
		}

		return { member };
	}
}
