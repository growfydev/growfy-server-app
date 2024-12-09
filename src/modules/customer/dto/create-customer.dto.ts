import {
	IsString,
	IsNotEmpty,
	IsOptional,
	IsInt,
	IsEnum,
} from 'class-validator';
import { GlobalStatus } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCustomerDto {
	@ApiProperty()
	@IsString()
	@IsNotEmpty({ message: 'Name is required' })
	name: string;

	@ApiProperty()
	@IsInt()
	@IsNotEmpty({ message: 'Profile ID is required' })
	profileId: number;

	@ApiProperty()
	@IsOptional()
	@IsEnum(GlobalStatus, {
		message: 'Invalid global status. Must be ACTIVE, INACTIVE, or DELETED',
	})
	globalStatus?: GlobalStatus = GlobalStatus.ACTIVE;

	@ApiProperty()
	@IsOptional()
	@IsString()
	email?: string;

	@ApiProperty()
	@IsOptional()
	@IsString()
	phone?: string;

	@ApiProperty()
	@IsOptional()
	metadata?: Record<string, object>;
}
