import { SetMetadata } from '@nestjs/common';
import { CoreRole as Role } from 'src/modules/auth/permissions/role.enum';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);