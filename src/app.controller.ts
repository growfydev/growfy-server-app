import { Controller, Get, Param } from '@nestjs/common';
import { Auth } from 'src/modules/auth/decorators/auth.decorator';
import { CoreRole, PermissionFlags } from '@prisma/client';

@Controller()
export class AppController {
    /**
     * Route to view a resource, accessible to users with `VIEW` permission.
     */
    @Get('view/:profileId')
    @Auth([CoreRole.USER], [PermissionFlags.VIEW]) // Requires `USER` role and `VIEW` permission for the profile
    async viewResource(@Param('profileId') profileId: number) {
        return { message: `You have access to view resources for profile ${profileId}.` };
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
