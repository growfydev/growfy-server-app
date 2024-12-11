import { applyDecorators, UseGuards, SetMetadata } from '@nestjs/common';
import { AuthGuard } from '../guards/jwt.guard';
import { PROFILE_ROLES_KEY, ROLES_KEY } from '../keys/roles.keys';
import { RolesGuard } from '../guards/role.guard';
import { ProfileMemberRoles, Role } from '@prisma/client';

/**
 * Auth Decorator
 * Combines role and permission metadata with guards for route-level authorization.
 * @param roles - List of required core roles for the route (defaults to [Role.USER]).
 * @param profileMemberRoles - List of required profile-specific roles (defaults to [ProfileMemberRoles.OWNER]).
 */
export function Auth(
	roles: Role[] = [Role.USER],
	profileMemberRoles: ProfileMemberRoles[] = [ProfileMemberRoles.OWNER],
) {
	return applyDecorators(
		SetMetadata(ROLES_KEY, roles),
		SetMetadata(PROFILE_ROLES_KEY, profileMemberRoles),
		UseGuards(AuthGuard, RolesGuard),
	);
}
