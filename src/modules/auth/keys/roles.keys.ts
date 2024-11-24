import { SetMetadata } from '@nestjs/common';
import { ProfileMemberRoles, Role } from '@prisma/client';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

export const PROFILE_ROLES_KEY = 'profile_roles';
export const ProfiileRoles = (...profile_roles: ProfileMemberRoles[]) =>
    SetMetadata(PROFILE_ROLES_KEY, profile_roles);
