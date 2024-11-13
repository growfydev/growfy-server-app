import { applyDecorators, UseGuards } from '@nestjs/common';
import { CoreRole as Role } from 'src/modules/auth/permissions/role.enum';
import { Roles } from './roles.decorator';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../guards/role.guard';


export function Auth(role: Role) {
    return applyDecorators(Roles(role), UseGuards(AuthGuard, RolesGuard));
}