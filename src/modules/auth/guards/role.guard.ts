import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CoreRole } from '@prisma/client';
import { UserRoles } from '../types/roles';
import { ROLES_KEY } from '../keys/roles.keys';
import { PERMISSIONS_KEY } from '../keys/permissions.keys';

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

        const { user } = context.switchToHttp().getRequest();
        const userRoles: UserRoles | undefined = user?.userRoles;

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

        const userRoleMatches = requiredRoles
            ? requiredRoles.includes(userRoles.userRole as CoreRole)
            : true;

        console.log('User Role Matches:', userRoleMatches);

        const userPermissions = new Set(userRoles.permissions);
        const hasRequiredPermissions = requiredPermissions
            ? requiredPermissions.every((perm) => userPermissions.has(perm))
            : true;

        console.log('Has Required Permissions:', hasRequiredPermissions);

        const accessGranted = userRoleMatches && hasRequiredPermissions;
        console.log('Access Granted:', accessGranted);

        return accessGranted;
    }
}
