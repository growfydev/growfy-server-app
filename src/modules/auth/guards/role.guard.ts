import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { RolesGuardService } from '../services/roles-guard.service';

@Injectable()
export class RolesGuard implements CanActivate {
	constructor(private readonly rolesGuardService: RolesGuardService) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const { user, requiredRoles, requiredProfileRoles, profileId } =
			await this.extractContextData(context);
		if (await this.rolesGuardService.isAdmin(user.id)) {
			this.rolesGuardService.logger.log(
				`Access granted for User ID: ${user.id} as ADMIN.`,
			);
			return true;
		}
		const hasAccess = await this.rolesGuardService.validateAccess(
			user.id,
			requiredRoles,
			requiredProfileRoles,
			profileId,
		);

		this.logAccessDecision(hasAccess, user.id, profileId);
		return hasAccess;
	}

	/**
	 * Extract relevant data from the context.
	 */
	private async extractContextData(context: ExecutionContext) {
		const { user, params, body } =
			this.rolesGuardService.getRequestData(context);
		const requiredRoles = this.rolesGuardService.getRequiredRoles(context);
		const requiredProfileRoles =
			this.rolesGuardService.getRequiredProfileRoles(context);
		const profileId = this.rolesGuardService.getProfileId(params, body);

		if (!user?.id) {
			throw new Error('Invalid or missing user information in request.');
		}

		return { user, requiredRoles, requiredProfileRoles, profileId };
	}

	/**
	 * Log the access decision.
	 */
	private logAccessDecision(
		hasAccess: boolean,
		userId: number,
		profileId: number | null,
	) {
		if (hasAccess) {
			this.rolesGuardService.logger.log(
				`Access granted for User ID: ${userId}${
					profileId ? `, Profile ID: ${profileId}` : ''
				}.`,
			);
		} else {
			this.rolesGuardService.logger.warn(
				`Access denied for User ID: ${userId}${
					profileId ? `, Profile ID: ${profileId}` : ''
				}.`,
			);
		}
	}
}
