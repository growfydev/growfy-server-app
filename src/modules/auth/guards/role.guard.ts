import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { RolesGuardService } from '../services/roles-guard.service';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private readonly rolesGuard: RolesGuardService) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.rolesGuard.getRequiredRoles(context);
        const requiredProfileRoles = this.rolesGuard.getRequiredProfileRoles(context);
        const { user, params, body } = this.rolesGuard.getRequestData(context);

        if (!user || !user.id || !user.role || !user.profiles) {
            return this.rolesGuard.denyAccess('Invalid or missing user information in JWT.');
        }

        if (this.rolesGuard.isAdminAccess(requiredRoles, user)) return true;

        const profileId = this.rolesGuard.getProfileId(params, body);
        if (!profileId) return this.rolesGuard.denyAccess('Invalid or missing profile ID.');

        const profile = this.rolesGuard.getProfile(user, profileId);
        if (!profile) return this.rolesGuard.denyAccess(`User lacks access to profile ID: ${profileId}`);

        return this.rolesGuard.validateAccess(requiredRoles, requiredProfileRoles, user, profile);
    }

}
