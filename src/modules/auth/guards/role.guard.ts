import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { RolesGuardService } from '../services/roles-guard.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly rolesGuard: RolesGuardService) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.rolesGuard.getRequiredRoles(context);
    const requiredProfileRoles =
      this.rolesGuard.getRequiredProfileRoles(context);
    const { user, params, body } = this.rolesGuard.getRequestData(context);

    if (!user || !user.id || !user.role) {
      return this.rolesGuard.denyAccess(
        'Invalid or missing user information in JWT.',
      );
    }

    if (this.rolesGuard.isAdminAccess(requiredRoles, user)) return true;

    const profileId = this.rolesGuard.getProfileId(params, body);
    if (!profileId) {
      return this.rolesGuard.denyAccess('Invalid or missing profile ID.');
    }

    const accessGranted = await this.rolesGuard.validateAccess(
      requiredRoles,
      requiredProfileRoles,
      user,
      profileId,
    );

    if (!accessGranted) {
      return this.rolesGuard.denyAccess(
        `Access denied for user ID: ${user.id} on profile ID: ${profileId}`,
      );
    }

    return true;
  }
}
