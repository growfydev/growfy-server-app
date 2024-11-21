import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CoreRole } from '@prisma/client';
import { ROLES_KEY } from '../keys/roles.keys';
import { PERMISSIONS_KEY } from '../keys/permissions.keys';
import { UserRoles, Profile } from '../types/roles';

@Injectable()
export class RolesGuard implements CanActivate {
    private readonly logger = new Logger(RolesGuard.name);

    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<CoreRole[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        const { user, params } = context.switchToHttp().getRequest();
        const userRoles: UserRoles = user?.userRoles;

        this.logger.debug('Required Roles:', requiredRoles);
        this.logger.debug('Required Permissions:', requiredPermissions);
        this.logger.debug('User Roles:', userRoles);

        if (!userRoles) {
            this.logger.warn('No user roles found. Access denied.');
            return false;
        }

        if (requiredRoles?.includes(CoreRole.ADMIN) && userRoles.userRole === CoreRole.ADMIN) {
            this.logger.debug('User is ADMIN. Access granted.');
            return true;
        }

        const profileId = Number(params?.profileId);
        if (isNaN(profileId)) {
            this.logger.warn('Invalid or missing profile ID. Access denied.');
            return false;
        }

        const profile = userRoles.profiles.find((p) => p.profileId === profileId);
        if (!profile) {
            this.logger.warn(`User does not have access to profile ID: ${profileId}. Access denied.`);
            return false;
        }

        this.logger.debug('Profile Permissions:', profile.permissions);
        this.logger.debug('Profile Member Role:', profile.memberRole);

        // Validar roles y permisos
        const userRoleMatches = this.hasMatchingRoles(requiredRoles, userRoles, profile);
        const hasRequiredPermissions = this.hasPermissions(requiredPermissions, profile);

        const accessGranted = userRoleMatches && hasRequiredPermissions;

        this.logger.debug('User Role Matches:', userRoleMatches);
        this.logger.debug('Has Required Permissions:', hasRequiredPermissions);
        this.logger.debug('Access Granted:', accessGranted);

        return accessGranted;
    }

    /**
 * Checks if the required roles match either the user's core role or the member role in the profile.
 *
 * @param {CoreRole[]} requiredRoles - The list of roles required to access the resource.
 * @param {UserRoles} userRoles - The roles associated with the current user.
 * @param {Profile} profile - The profile being checked for role access.
 * @returns {boolean} - Returns `true` if any of the required roles match the user's roles or the profile's member role, otherwise `false`.
 */
    private hasMatchingRoles(requiredRoles: CoreRole[], userRoles: UserRoles, profile: Profile): boolean {
        if (!requiredRoles?.length) return true;
        return requiredRoles.includes(userRoles.userRole as CoreRole) || requiredRoles.includes(profile.memberRole as CoreRole);
    }

    /**
     * Checks if the profile contains all the permissions required to access the resource.
     *
     * @param {string[]} requiredPermissions - The list of permissions required to access the resource.
     * @param {Profile} profile - The profile being checked for permissions.
     * @returns {boolean} - Returns `true` if the profile has all required permissions, otherwise `false`.
     */
    private hasPermissions(requiredPermissions: string[], profile: Profile): boolean {
        if (!requiredPermissions?.length) return true;
        const userPermissions = new Set(profile.permissions);
        return requiredPermissions.every((perm) => userPermissions.has(perm));
    }
}
