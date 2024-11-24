import { ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { CoreRole, TeamRole } from '@prisma/client';
import { TEAM_ROLES_KEYS } from '../keys/teamroles.keys';
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

    getRequiredProfileRoles(context: ExecutionContext): TeamRole[] {
        return this.reflector.getAllAndOverride<TeamRole[]>(TEAM_ROLES_KEYS, [
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

    isAdminAccess(requiredRoles: CoreRole[], user: JwtPayloadType['user']): boolean {
        if (requiredRoles?.includes(CoreRole.ADMIN) && user.role === CoreRole.ADMIN) {
            this.logger.debug('User is ADMIN. Access granted.');
            return true;
        }
        return false;
    }

    checkRolesWithoutPermissions(requiredRoles: CoreRole[], user: JwtPayloadType['user']): boolean {
        const hasRoles = this.hasMatchingRoles(requiredRoles, user, null);
        this.logger.debug(`Access granted without profile check: ${hasRoles}`);
        return hasRoles;
    }

    getProfileId(params: Record<string, any>, body: Record<string, any>): number | null {
        const profileId = Number(params?.profileId || body?.profileId);
        return isNaN(profileId) ? null : profileId;
    }

    getProfile(user: JwtPayloadType['user'], profileId: number): ProfileType | undefined {
        if (!user.profiles || !user.profiles.length) {
            this.logger.warn(`User has no profiles.`);
            return undefined;
        }

        const profile = user.profiles.find((p) => p.id === profileId);

        if (!profile) {
            this.logger.warn(`No matching profile found for ID: ${profileId}`);
        }

        return profile;
    }


    validateAccess(
        requiredRoles: CoreRole[],
        requiredProfileRoles: TeamRole[],
        user: JwtPayloadType['user'],
        profile: ProfileType
    ): boolean {
        const roleMatches = this.hasMatchingRoles(requiredRoles, user, profile);
        const profileRolesMatch = this.hasMatchingProfileRoles(requiredProfileRoles, profile);

        const accessGranted = roleMatches && profileRolesMatch;

        this.logger.debug(`Core Role Matches: ${roleMatches}`);
        this.logger.debug(`Profile Roles Match: ${profileRolesMatch}`);
        this.logger.debug(`Access Granted: ${accessGranted}`);

        return accessGranted;
    }


    denyAccess(reason: string): boolean {
        this.logger.warn(reason);
        return false;
    }

    hasMatchingRoles(requiredRoles: CoreRole[], user: JwtPayloadType['user'], profile: ProfileType | null): boolean {
        if (!requiredRoles?.length) return true;
        return (
            requiredRoles.includes(user.role as CoreRole) ||
            (profile?.roles && requiredRoles.includes(profile.roles as CoreRole))
        );
    }

    hasMatchingProfileRoles(requiredProfileRoles: TeamRole[], profile: ProfileType): boolean {
        if (!requiredProfileRoles?.length) return true;
        const userProfileRoles = Array.isArray(profile.roles)
            ? new Set(profile.roles)
            : new Set(profile.roles.split(','));

        const isMatch = requiredProfileRoles.every((role) => userProfileRoles.has(role));

        if (!isMatch) {
            this.logger.warn(
                `Profile roles do not match. Required: ${requiredProfileRoles.join(', ')}, UserProfileRoles: ${Array.from(userProfileRoles).join(', ')}`
            );
        }

        return isMatch;
    }


}
