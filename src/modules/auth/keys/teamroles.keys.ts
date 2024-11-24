import { SetMetadata } from '@nestjs/common';

export const TEAM_ROLES_KEYS = 'team_roles';
export const TeamRoles = (...team_roles: string[]) =>
    SetMetadata(TEAM_ROLES_KEYS, team_roles);
