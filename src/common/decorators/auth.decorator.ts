import { applyDecorators, UseGuards } from '@nestjs/common';
import { CoreRole as Role } from 'src/lib/permissions/role.enum';
import { RolesGuard } from 'src/guards/role.guard';
import { AuthGuard } from 'src/guards/jwt.guard';
import { Roles } from './roles.decorator';


export function Auth(role: Role) {
    return applyDecorators(Roles(role), UseGuards(AuthGuard, RolesGuard));
}