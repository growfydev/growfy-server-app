import { IsEmail, IsArray, IsEnum, IsOptional, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ProfileMemberRoles } from '@prisma/client';

export class InviteUserDto {
	@ApiProperty()
	@IsEmail()
	email: string;

	@ApiProperty()
	@IsInt()
	@IsOptional()
	profileId?: number;

	@ApiProperty({ isArray: true, enum: ProfileMemberRoles })
	@IsArray()
	@IsEnum(ProfileMemberRoles, { each: true })
	roles: ProfileMemberRoles[];
}
