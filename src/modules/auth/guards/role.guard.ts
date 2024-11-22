import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { CoreRole } from '@prisma/client'; // Adjust if using a different source for roles
import { RolesGuardService } from '../services/roles-guard.service';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private readonly rolesGuard: RolesGuardService) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.rolesGuard.getRequiredRoles(context);
        const requiredPermissions = this.rolesGuard.getRequiredPermissions(context);

        const { user, params, body } = this.rolesGuard.getRequestData(context);

        if (!user || !user.id || !user.role || !user.profiles) {
            return this.rolesGuard.denyAccess('Invalid or missing user information in JWT.');
        }

        const userData = {
            id: user.id,
            role: user.role,
            profiles: user.profiles,
        };

        if (this.rolesGuard.isAdminAccess(requiredRoles, userData)) return true;

        if (!requiredPermissions?.length) {
            return this.rolesGuard.checkRolesWithoutPermissions(requiredRoles, userData);
        }

        const profileId = this.rolesGuard.getProfileId(params, body);
        if (!profileId) return this.rolesGuard.denyAccess('Invalid or missing profile ID.');

        const profile = this.rolesGuard.getProfile(userData, profileId);
        if (!profile) return this.rolesGuard.denyAccess(`User lacks access to profile ID: ${profileId}`);

        return this.rolesGuard.validateAccess(requiredRoles, requiredPermissions, userData, profile);
    }
}
