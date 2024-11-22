import { IsEmail, IsEnum, IsInt, IsOptional } from 'class-validator';
import { TeamRole } from '@prisma/client';

export class InviteUserDto {
    @IsEmail()
    email: string;

    @IsInt()
    @IsOptional()
    profileId?: number;

    @IsEnum(TeamRole)
    role: TeamRole;
}