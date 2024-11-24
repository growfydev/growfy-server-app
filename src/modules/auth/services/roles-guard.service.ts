import { ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { Role, ProfileMemberRoles } from '@prisma/client';
import { PROFILE_ROLES_KEY, ROLES_KEY } from '../keys/roles.keys';
import { JwtPayloadType, ProfileType } from '../types/auth';
import { Reflector } from '@nestjs/core';
import { RequestDataType } from '../types/auth';

@Injectable()
export class RolesGuardService {
  private readonly logger = new Logger(RolesGuardService.name);

  constructor(private readonly reflector: Reflector) {}

  getRequiredRoles(context: ExecutionContext): Role[] {
    return this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
  }

  getRequiredProfileRoles(context: ExecutionContext): ProfileMemberRoles[] {
    return this.reflector.getAllAndOverride<ProfileMemberRoles[]>(
      PROFILE_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
  }

  getRequestData(context: ExecutionContext): RequestDataType {
    const request = context.switchToHttp().getRequest();
    return {
      user: request.user as JwtPayloadType['user'],
      params: request.params as Record<string, any>,
      body: request.body as Record<string, any>,
    };
  }

  isAdminAccess(requiredRoles: Role[], user: JwtPayloadType['user']): boolean {
    if (requiredRoles?.includes(Role.ADMIN) && user.role === Role.ADMIN) {
      this.logger.debug('User is ADMIN. Access granted.');
      return true;
    }
    return false;
  }

  checkRolesWithoutPermissions(
    requiredRoles: Role[],
    user: JwtPayloadType['user'],
  ): boolean {
    const hasRoles = this.hasMatchingRoles(requiredRoles, user);
    this.logger.debug(`Access granted without profile check: ${hasRoles}`);
    return hasRoles;
  }

  getProfileId(
    params: Record<string, any>,
    body: Record<string, any>,
  ): number | null {
    const profileId = Number(params?.profileId || body?.profileId);
    return isNaN(profileId) ? null : profileId;
  }

  getProfile(
    user: JwtPayloadType['user'],
    profileId: number,
  ): ProfileType | undefined {
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
    requiredRoles: Role[],
    requiredProfileRoles: ProfileMemberRoles[],
    user: JwtPayloadType['user'],
    profile: ProfileType,
  ): boolean {
    const roleMatches = this.hasMatchingRoles(requiredRoles, user);
    const profileRolesMatch = this.hasMatchingProfileRoles(
      requiredProfileRoles,
      profile,
    );

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

  hasMatchingRoles(
    requiredRoles: Role[],
    user: JwtPayloadType['user'],
  ): boolean {
    if (!requiredRoles?.length) return true;
    return requiredRoles.includes(user.role as Role);
  }

  hasMatchingProfileRoles(
    requiredProfileRoles: ProfileMemberRoles[],
    profile: ProfileType,
  ): boolean {
    if (!requiredProfileRoles?.length) return true;
    const userProfileRoles = Array.isArray(profile.roles)
      ? new Set(profile.roles)
      : new Set(profile.roles.split(','));

    const isMatch = requiredProfileRoles.every((role) =>
      userProfileRoles.has(role),
    );

    if (!isMatch) {
      this.logger.warn(
        `Profile roles do not match. Required: ${requiredProfileRoles.join(', ')}, UserProfileRoles: ${Array.from(userProfileRoles).join(', ')}`,
      );
    }

    return isMatch;
  }
}
