import { ExecutionContext, Injectable } from '@nestjs/common';
import { Role, ProfileMemberRoles } from '@prisma/client';
import { PROFILE_ROLES_KEY, ROLES_KEY } from '../keys/roles.keys';
import { Reflector } from '@nestjs/core';
import { PrismaService } from 'src/core/prisma.service';
import { Service } from 'src/service';

@Injectable()
export class RolesGuardService extends Service {
	constructor(
		private readonly reflector: Reflector,
		private readonly prisma: PrismaService,
	) {
		super(RolesGuardService.name);
	}

	/**
	 * Retrieve required global roles for a handler or class.
	 */
	getRequiredRoles(context: ExecutionContext): Role[] {
		const roles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
			context.getHandler(),
			context.getClass(),
		]);
		this.logger.log(
			`Required Roles for Route: ${roles?.join(', ') || 'USER'}`,
		);
		return roles || [Role.USER];
	}

	/**
	 * Retrieve required profile-specific roles for a handler or class.
	 */
	getRequiredProfileRoles(context: ExecutionContext): ProfileMemberRoles[] {
		const roles = this.reflector.getAllAndOverride<ProfileMemberRoles[]>(
			PROFILE_ROLES_KEY,
			[context.getHandler(), context.getClass()],
		);
		this.logger.log(
			`Required Profile Roles for Route: ${roles?.join(', ') || 'OWNER'}`,
		);
		return roles || [ProfileMemberRoles.OWNER];
	}

	/**
	 * Extract request data for validation.
	 */
	getRequestData(context: ExecutionContext) {
		const request = context.switchToHttp().getRequest();
		this.logger.log(
			`Request Params: ${JSON.stringify(request.params)}, Body: ${JSON.stringify(request.body)}`,
		);
		return {
			user: request.user,
			params: request.params,
			body: request.body,
		};
	}

	/**
	 * Fetch global role and profile roles dynamically using userId.
	 */
	async fetchRolesAndPermissions(userId: number): Promise<{
		globalRole: Role;
		profileRoles: { profileId: number; role: ProfileMemberRoles }[];
	}> {
		this.logger.log(
			`Fetching roles and permissions for User ID: ${userId}`,
		);

		const user = await this.prisma.user.findUnique({
			where: { id: userId },
			include: {
				members: {
					select: {
						profileId: true,
						role: true,
					},
				},
			},
		});

		if (!user) {
			this.logger.warn(`User ID ${userId} not found.`);
			throw new Error(`User with ID ${userId} not found.`);
		}

		const globalRole = user.role;
		const profileRoles = user.members.map((member) => ({
			profileId: member.profileId,
			role: member.role,
		}));

		this.logger.log(
			`Fetched Global Role: ${globalRole}, Profile Roles: ${JSON.stringify(
				profileRoles,
			)}`,
		);

		return { globalRole, profileRoles };
	}

	/**
	 * Validate access based on global roles and profile-specific roles.
	 */
	async validateAccess(
		userId: number,
		requiredRoles: Role[],
		requiredProfileRoles: ProfileMemberRoles[],
		profileId: number | null,
	): Promise<boolean> {
		this.logger.log(
			`Validating access for User ID: ${userId}, Profile ID: ${profileId}`,
		);

		const { globalRole, profileRoles } =
			await this.fetchRolesAndPermissions(userId);

		if (requiredRoles.length) {
			const roleMatch = requiredRoles.includes(globalRole);
			this.logger.log(
				`Global Role Validation: Required=${requiredRoles.join(
					', ',
				)}, UserRole=${globalRole}, Match=${roleMatch}`,
			);
			if (!roleMatch) {
				this.logger.warn(
					`Access denied. User ID ${userId} does not meet required global roles.`,
				);
				return false;
			}
		}

		if (requiredProfileRoles.length && profileId !== null) {
			const profileRole = profileRoles.find(
				(role) => role.profileId === profileId,
			);
			const profileRolesMatch =
				profileRole && requiredProfileRoles.includes(profileRole.role);

			this.logger.log(
				`Profile Role Validation: Required=${requiredProfileRoles.join(
					', ',
				)}, ProfileID=${profileId}, UserRole=${
					profileRole?.role || 'NONE'
				}, Match=${profileRolesMatch}`,
			);

			if (!profileRolesMatch) {
				this.logger.warn(
					`Access denied. User ID ${userId} does not have the required roles for Profile ID ${profileId}.`,
				);
				return false;
			}
		}

		this.logger.log(
			`Access granted for User ID: ${userId}, Profile ID: ${profileId}`,
		);
		return true;
	}

	/**
	 * Check if the user is an admin.
	 */
	async isAdmin(userId: number): Promise<boolean> {
		const user = await this.prisma.user.findUnique({
			where: { id: userId },
			select: { role: true },
		});

		const isAdmin = user?.role === Role.ADMIN;
		this.logger.log(
			`Admin Check for User ID ${userId}: IsAdmin=${isAdmin}`,
		);
		return isAdmin;
	}

	/**
	 * Extract profile ID from request parameters or body.
	 */
	getProfileId(
		params: Record<string, unknown>,
		body: Record<string, unknown>,
	): number | null {
		const profileId = Number(params?.profileId || body?.profileId);
		this.logger.log(`Extracted Profile ID: ${profileId || 'NONE'}`);
		return isNaN(profileId) ? null : profileId;
	}
}
