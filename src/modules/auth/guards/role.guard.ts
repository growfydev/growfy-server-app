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

    // Validate basic user information from JWT
    if (!user || !user.id || !user.role || !user.profiles) {
      return this.rolesGuard.denyAccess(
        'Invalid or missing user information in JWT.',
      );
    }

    // Allow access for admin roles directly
    if (this.rolesGuard.isAdminAccess(requiredRoles, user)) return true;

    // Fetch profile ID from the request
    const profileId = this.rolesGuard.getProfileId(params, body);
    if (!profileId)
      return this.rolesGuard.denyAccess('Invalid or missing profile ID.');

    // Validate user's access to the profile
    const profile = this.rolesGuard.getProfile(user, profileId);
    if (!profile)
      return this.rolesGuard.denyAccess(
        `User lacks access to profile ID: ${profileId}`,
      );

    // Use the updated async validateAccess method
    const accessGranted = await this.rolesGuard.validateAccess(
      requiredRoles,
      requiredProfileRoles,
      user,
      profile,
    );

    if (!accessGranted) {
      return this.rolesGuard.denyAccess(
        `Access denied for user ID: ${user.id} on profile ID: ${profileId}`,
      );
    }

    return true;
  }
}
