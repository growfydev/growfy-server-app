import { Controller, Get, Param } from '@nestjs/common';
import { Auth } from 'src/modules/auth/decorators/auth.decorator';
import { CoreRole, PermissionFlags } from '@prisma/client';
import { ActiveUser } from './modules/auth/decorators/session.decorator';
import { UserType } from './modules/auth/types/auth';

@Controller()
export class AppController {
    /**
     * Route to view a resource, accessible to users with `VIEW` permission.
     */
    @Get('view/:profileId')
    @Auth([CoreRole.USER], [PermissionFlags.VIEW]) // Requires `USER` role and `VIEW` permission for the profile
    async viewResource(@ActiveUser() user: UserType, @Param('profileId') profileId: number) {
        return {
            message: `You have access to view resources for profile ${profileId}.`,
            user,
        };
    }

    /**
     * Route to manage resources, accessible only to `ADMIN` role.
     */
    @Get('manage/:profileId')
    @Auth([CoreRole.ADMIN]) // Requires `ADMIN` role, no specific permissions needed
    async manageResource(@Param('profileId') profileId: number) {
        return { message: `You have access to manage resources for profile ${profileId}.` };
    }
}
