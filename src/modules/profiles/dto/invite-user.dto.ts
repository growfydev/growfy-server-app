import { IsEmail, IsEnum, IsInt, IsOptional } from 'class-validator';
import { ProfileMemberRoles } from '@prisma/client';

export class InviteUserDto {
    @IsEmail()
    email: string;

    @IsInt()
    @IsOptional()
    profileId?: number;

    @IsEnum(ProfileMemberRoles)
    role: ProfileMemberRoles;
}