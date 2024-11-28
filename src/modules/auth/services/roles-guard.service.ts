import { ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { Role, ProfileMemberRoles, Profile } from '@prisma/client';
import { PROFILE_ROLES_KEY, ROLES_KEY } from '../keys/roles.keys';
import { JwtPayloadType } from '../types/auth';
import { Reflector } from '@nestjs/core';
import { RequestDataType } from '../types/auth';
import { PrismaService } from 'src/core/prisma.service';

@Injectable()
export class RolesGuardService {
  private readonly logger = new Logger(RolesGuardService.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) { }

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

  async validateAccess(
    requiredRoles: Role[],
    requiredProfileRoles: ProfileMemberRoles[],
    user: JwtPayloadType['user'],
    profileId: number,
  ): Promise<boolean> {
    const roleMatches = this.hasMatchingRoles(requiredRoles, user);
    const profileRolesMatch = await this.hasMatchingProfileRoles(
      requiredProfileRoles,
      profileId,
      user.id,
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
    const userRoles = Array.isArray(user.role) ? user.role : [user.role];
    const hasAllRoles = requiredRoles.every((role) => userRoles.includes(role));

    if (!hasAllRoles) {
      this.logger.warn(
        `User does not have all required roles. Required: ${requiredRoles.join(
          ', ',
        )}, User Roles: ${userRoles.join(', ')}`,
      );
    }

    return hasAllRoles;
  }

  async hasMatchingProfileRoles(
    requiredProfileRoles: ProfileMemberRoles[],
    profileId: number,
    userId: number,
  ): Promise<boolean> {
    if (!requiredProfileRoles?.length) return true; 

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

    const hasAllProfileRoles = requiredProfileRoles.every((role) =>
      userProfileRoles.has(role),
    );

    if (!hasAllProfileRoles) {
      this.logger.warn(
        `Profile does not have all required profile roles. Required: ${requiredProfileRoles.join(
          ', ',
        )}, UserProfileRoles: ${Array.from(userProfileRoles).join(', ')}`,
      );
    }

    return hasAllProfileRoles;
  }
}
