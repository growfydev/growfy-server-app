import { applyDecorators, UseGuards, SetMetadata } from '@nestjs/common';
import { AuthGuard } from '../guards/jwt.guard';
import { CoreRole, TeamRole } from '@prisma/client';
import { ROLES_KEY } from '../keys/roles.keys';
import { TEAM_ROLES_KEYS } from '../keys/teamroles.keys';
import { RolesGuard } from '../guards/role.guard';

/**
 * Auth Decorator
 * Combines role and permission metadata with guards for route-level authorization.
 * @param roles - List of required core roles for the route
 * @param teamRoles - List of required team roles to have access to an specific feature.
 */
export function Auth(roles: CoreRole[] = [], teamRoles: TeamRole[] = []) {
    return applyDecorators(
        SetMetadata(ROLES_KEY, roles),
        SetMetadata(TEAM_ROLES_KEYS, teamRoles),
        UseGuards(AuthGuard, RolesGuard),
    );
}
