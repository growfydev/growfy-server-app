import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CoreRole } from '@prisma/client';
import { ROLES_KEY } from '../keys/roles.keys';
import { PERMISSIONS_KEY } from '../keys/permissions.keys';
import { UserRoles } from '../types/roles';

@Injectable()
export class RolesGuard implements CanActivate {
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

        console.log('Required Roles:', requiredRoles);
        console.log('Required Permissions:', requiredPermissions);
        console.log('User Roles:', userRoles);

        if (!userRoles) {
            console.log('No user roles found. Access denied.');
            return false;
        }

        if (requiredRoles?.includes(CoreRole.ADMIN) && userRoles.userRole === CoreRole.ADMIN) {
            console.log('User is ADMIN. Access granted.');
            return true;
        }

        const profileId = params?.profileId; 
        if (!profileId) {
            console.log('No profile ID found in request. Access denied.');
            return false;
        }

        const profile = userRoles.profiles.find((p) => p.profileId === Number(profileId));
        if (!profile) {
            console.log(`User does not have access to profile ID: ${profileId}. Access denied.`);
            return false;
        }

        console.log('Profile Permissions:', profile.permissions);
        console.log('Profile Member Role:', profile.memberRole);

        const userRoleMatches = requiredRoles?.length
            ? requiredRoles.includes(userRoles.userRole as CoreRole) ||
            requiredRoles.includes(profile.memberRole as CoreRole)
            : true;

        const userPermissions = new Set(profile.permissions);
        const hasRequiredPermissions = requiredPermissions?.length
            ? requiredPermissions.every((perm) => userPermissions.has(perm))
            : true;

        const accessGranted = userRoleMatches && hasRequiredPermissions;

        console.log('User Role Matches:', userRoleMatches);
        console.log('Has Required Permissions:', hasRequiredPermissions);
        console.log('Access Granted:', accessGranted);

        return accessGranted;
    }
}
