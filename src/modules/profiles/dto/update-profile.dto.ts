import { PartialType } from '@nestjs/mapped-types';
import { CreateProfileDto } from './create-profile.dto';
import { IsOptional, IsString, IsEnum } from 'class-validator';
import { GlobalStatus } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProfileDto extends PartialType(CreateProfileDto) {
	@ApiProperty()
	@IsOptional()
	@IsString()
	name?: string;

	@ApiProperty()
	@IsOptional()
	@IsEnum(GlobalStatus)
	globalStatus?: GlobalStatus;
}
