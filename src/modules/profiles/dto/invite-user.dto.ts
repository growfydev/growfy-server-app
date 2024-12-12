import { IsArray, IsEmail, IsEnum, IsInt, IsOptional } from 'class-validator';
import { ProfileMemberRoles } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class InviteUserDto {
	@ApiProperty()
	@IsEmail()
	email: string;

	@ApiProperty()
	@IsInt()
	@IsOptional()
	profileId?: number;

	@IsArray()
	@ApiProperty()
	@IsEnum(ProfileMemberRoles)
	roles: ProfileMemberRoles[];
}
