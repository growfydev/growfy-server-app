import { Controller, Get } from '@nestjs/common';
import { Auth } from 'src/modules/auth/decorators/auth.decorator';
import { CoreRole } from '@prisma/client';

@Controller()
export class AppController {
    @Get('view')
    @Auth(CoreRole.USER, ['VIEW'])
    async viewResource() {
        return { message: 'You have access to view this resource.' };
    }

    @Get('manage')
    @Auth(CoreRole.ADMIN)
    async manageResource() {
        return { message: 'You have access to manage this resource.' };
    }
}
