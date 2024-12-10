import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { RolesGuardService } from '../services/roles-guard.service';
import { Role } from '@prisma/client';

@Injectable()
export class RolesGuard implements CanActivate {
	constructor(private readonly rolesGuardService: RolesGuardService) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const requiredRoles = this.rolesGuardService.getRequiredRoles(context);
		const requiredProfileRoles =
			this.rolesGuardService.getRequiredProfileRoles(context);

		// Extract request data
		const { user, params, body } =
			this.rolesGuardService.getRequestData(context);

		// Validate the presence of userId
		if (!user?.id) {
			this.rolesGuardService.logger.warn(
				'Invalid or missing user information in request.',
			);
			return false;
		}

		// Check for global roles (e.g., Admin)
		if (requiredRoles.includes(Role.ADMIN)) {
			const isAdmin = await this.rolesGuardService.isAdminAccess(
				requiredRoles,
				user.id,
			);
			if (!isAdmin) {
				this.rolesGuardService.logger.warn(
					`Access denied. User ID ${user.id} does not have ADMIN role.`,
				);
				return false;
			}
			return true;
		}

		// Skip profile-specific role checks if not required
		if (!requiredProfileRoles.length) {
			return true;
		}

		// Validate profile-specific roles
		const profileId = this.rolesGuardService.getProfileId(params, body);
		if (!profileId) {
			this.rolesGuardService.logger.warn(
				'Invalid or missing profile ID.',
			);
			return false;
		}

		const accessGranted = await this.rolesGuardService.validateAccess(
			requiredRoles,
			requiredProfileRoles,
			user.id,
			profileId,
		);

		if (!accessGranted) {
			this.rolesGuardService.logger.warn(
				`Access denied for user ID: ${user.id} on profile ID: ${profileId}`,
			);
			return false;
		}

		return true;
	}
}
