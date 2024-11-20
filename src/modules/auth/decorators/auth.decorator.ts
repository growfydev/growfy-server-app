import { applyDecorators, UseGuards, SetMetadata } from '@nestjs/common';
import { RolesGuard } from '../guards/role.guard';
import { AuthGuard } from '../guards/jwt.guard';
import { CoreRole } from '@prisma/client';
import { ROLES_KEY } from '../keys/roles.keys';
import { Permissions } from '../keys/permissions.keys';

export function Auth(role: CoreRole, permissions: string[] = []) {
    return applyDecorators(
        SetMetadata(ROLES_KEY, [role]),
        Permissions(...permissions),
        UseGuards(AuthGuard, RolesGuard)
    );
}
