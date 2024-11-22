import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { UserRoles } from '../types/roles';
import { RolesGuardService } from '../services/roles-guard.service';

@Injectable()
export class RolesGuard implements CanActivate {

    constructor(
        private readonly rolesGuard: RolesGuardService
    ) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.rolesGuard.getRequiredRoles(context);
        const requiredPermissions = this.rolesGuard.getRequiredPermissions(context);

        const { user, params, body } = this.rolesGuard.getRequestData(context);
        const userRoles: UserRoles = user?.userRoles;

        if (!userRoles) return this.rolesGuard.denyAccess('No user roles found.');

        if (this.rolesGuard.isAdminAccess(requiredRoles, userRoles)) return true;

        if (!requiredPermissions?.length) {
            return this.rolesGuard.checkRolesWithoutPermissions(requiredRoles, userRoles);
        }

        const profileId = this.rolesGuard.getProfileId(params, body);
        if (!profileId) return this.rolesGuard.denyAccess('Invalid or missing profile ID.');

        const profile = this.rolesGuard.getProfile(userRoles, profileId);
        if (!profile) return this.rolesGuard.denyAccess(`User lacks access to profile ID: ${profileId}`);

        return this.rolesGuard.validateAccess(requiredRoles, requiredPermissions, userRoles, profile);
    }
}
