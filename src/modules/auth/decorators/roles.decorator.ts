import { SetMetadata } from '@nestjs/common';
import { CoreRole as Role } from 'src/lib/permissions/role.enum';

export const ROLES_KEY = 'roles';
export const Roles = (role: Role) => SetMetadata(ROLES_KEY, role);