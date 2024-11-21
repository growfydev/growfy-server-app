import { IsInt, IsEnum } from 'class-validator';
import { TeamRole } from '@prisma/client';

export class CreateMemberDto {
    @IsInt()
    userId: number;

    @IsInt()
    profileId: number;

    @IsEnum(TeamRole)
    role: TeamRole;
}