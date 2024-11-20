import { applyDecorators, UseGuards, SetMetadata } from '@nestjs/common';
import { AuthGuard } from '../guards/jwt.guard';
import { CoreRole } from '@prisma/client';
import { ROLES_KEY } from '../keys/roles.keys';
import { PERMISSIONS_KEY } from '../keys/permissions.keys';
import { RolesGuard } from '../guards/role.guard';

/**
 * Auth Decorator
 * Combines role and permission metadata with guards for route-level authorization.
 * @param roles - List of required core roles for the route
 * @param permissions - List of required permissions for the route
 */
export function Auth(roles: CoreRole[] = [], permissions: string[] = []) {
    return applyDecorators(
        SetMetadata(ROLES_KEY, roles),
        SetMetadata(PERMISSIONS_KEY, permissions),
        UseGuards(AuthGuard, RolesGuard),
    );
}
