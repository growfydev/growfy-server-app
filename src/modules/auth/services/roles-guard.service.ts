import { ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { CoreRole } from '@prisma/client'; // Adjust as needed
import { PERMISSIONS_KEY } from '../keys/permissions.keys';
import { ROLES_KEY } from '../keys/roles.keys';
import { JwtPayloadType, ProfileType } from '../types/auth';
import { Reflector } from '@nestjs/core';
import { RequestDataType } from '../types/auth';

@Injectable()
export class RolesGuardService {
    private readonly logger = new Logger(RolesGuardService.name);

    constructor(private readonly reflector: Reflector) { }

    getRequiredRoles(context: ExecutionContext): CoreRole[] {
        return this.reflector.getAllAndOverride<CoreRole[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
    }

    getRequiredPermissions(context: ExecutionContext): string[] {
        return this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
    }

    getRequestData(context: ExecutionContext): RequestDataType {
        const request = context.switchToHttp().getRequest();
        return {
            user: request.user as JwtPayloadType['user'],
            params: request.params as Record<string, any>,
            body: request.body as Record<string, any>,
        };
    }

    isAdminAccess(requiredRoles: CoreRole[], userRoles: JwtPayloadType['user']): boolean {
        if (requiredRoles?.includes(CoreRole.ADMIN) && userRoles.role === CoreRole.ADMIN) {
            this.logger.debug('User is ADMIN. Access granted.');
            return true;
        }
        return false;
    }

    checkRolesWithoutPermissions(requiredRoles: CoreRole[], userRoles: JwtPayloadType['user']): boolean {
        const hasRoles = this.hasMatchingRoles(requiredRoles, userRoles, null);
        this.logger.debug(`Access granted without profile check: ${hasRoles}`);
        return hasRoles;
    }

    getProfileId(params: Record<string, any>, body: Record<string, any>): number | null {
        const profileId = Number(params?.profileId || body?.profileId);
        return isNaN(profileId) ? null : profileId;
    }

    getProfile(userRoles: JwtPayloadType['user'], profileId: number): ProfileType | undefined {
        return userRoles.profiles.find((p) => p.id === profileId);
    }

    validateAccess(
        requiredRoles: CoreRole[],
        requiredPermissions: string[],
        userRoles: JwtPayloadType['user'],
        profile: ProfileType
    ): boolean {
        const roleMatches = this.hasMatchingRoles(requiredRoles, userRoles, profile);
        const permissionMatches = this.hasPermissions(requiredPermissions, profile);

        const accessGranted = roleMatches && permissionMatches;

        this.logger.debug(`Role Matches: ${roleMatches}`);
        this.logger.debug(`Permission Matches: ${permissionMatches}`);
        this.logger.debug(`Access Granted: ${accessGranted}`);

        return accessGranted;
    }

    denyAccess(reason: string): boolean {
        this.logger.warn(reason);
        return false;
    }

    hasMatchingRoles(requiredRoles: CoreRole[], userRoles: JwtPayloadType['user'], profile: ProfileType | null): boolean {
        if (!requiredRoles?.length) return true;
        return (
            requiredRoles.includes(userRoles.role as CoreRole) ||
            (profile?.roles && requiredRoles.includes(profile.roles as CoreRole))
        );
    }

    hasPermissions(requiredPermissions: string[], profile: ProfileType): boolean {
        if (!requiredPermissions?.length) return true;
        const userPermissions = new Set(profile.permissions);
        return requiredPermissions.every((perm) => userPermissions.has(perm));
    }
}
