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
		return (
			this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
				context.getHandler(),
				context.getClass(),
			]) || [Role.USER]
		);
	}

	/**
	 * Retrieve required profile-specific roles for a handler or class.
	 */
	getRequiredProfileRoles(context: ExecutionContext): ProfileMemberRoles[] {
		return (
			this.reflector.getAllAndOverride<ProfileMemberRoles[]>(
				PROFILE_ROLES_KEY,
				[context.getHandler(), context.getClass()],
			) || [ProfileMemberRoles.OWNER]
		);
	}

	/**
	 * Extract request data for validation.
	 */
	getRequestData(context: ExecutionContext) {
		const request = context.switchToHttp().getRequest();
		return {
			user: request.user,
			params: request.params,
			body: request.body,
		};
	}

	/**
	 * Validate if a user has admin-level access based on global roles.
	 */
	async isAdminAccess(
		requiredRoles: Role[],
		userId: number,
	): Promise<boolean> {
		if (!requiredRoles.includes(Role.ADMIN)) return false;

		// Fetch user information from the database
		const user = await this.prisma.user.findUnique({
			where: { id: userId },
			select: { role: true },
		});

		if (user?.role === Role.ADMIN) {
			this.logger.debug(`User ID ${userId} is ADMIN. Access granted.`);
			return true;
		}

		return false;
	}

	/**
	 * Extract profile ID from request parameters or body.
	 */
	getProfileId(
		params: Record<string, unknown>,
		body: Record<string, unknown>,
	): number | null {
		const profileId = Number(params?.profileId || body?.profileId);
		return isNaN(profileId) ? null : profileId;
	}

	/**
	 * Validate access based on global roles and profile-specific roles.
	 */
	async validateAccess(
		requiredRoles: Role[],
		requiredProfileRoles: ProfileMemberRoles[],
		userId: number,
		profileId: number,
	): Promise<boolean> {
		// Validate global roles
		const roleMatches = await this.isAdminAccess(requiredRoles, userId);

		// Validate profile-specific roles
		const profileRolesMatch = await this.hasMatchingProfileRoles(
			requiredProfileRoles,
			profileId,
			userId,
		);

		const accessGranted = roleMatches || profileRolesMatch;

		this.logger.debug(`Core Role Matches: ${roleMatches}`);
		this.logger.debug(`Profile Roles Match: ${profileRolesMatch}`);
		this.logger.debug(`Access Granted: ${accessGranted}`);

		return accessGranted;
	}

	/**
	 * Validate if the user has the required roles in a specific profile.
	 */
	async hasMatchingProfileRoles(
		requiredProfileRoles: ProfileMemberRoles[],
		profileId: number,
		userId: number,
	): Promise<boolean> {
		if (!requiredProfileRoles?.length) return true;

		// Fetch user's roles in the specified profile
		const members = await this.prisma.member.findMany({
			where: {
				profileId,
				userId,
			},
			select: {
				role: true,
			},
		});

		const userProfileRoles = new Set(members.map((member) => member.role));

		// Check if the user has all required profile roles
		const hasAllProfileRoles = requiredProfileRoles.every((role) =>
			userProfileRoles.has(role),
		);

		if (!hasAllProfileRoles) {
			this.logger.warn(
				`Profile ID ${profileId} does not have all required profile roles. Required: ${requiredProfileRoles.join(
					', ',
				)}, UserProfileRoles: ${Array.from(userProfileRoles).join(', ')}`,
			);
		}

		return hasAllProfileRoles;
	}
}
