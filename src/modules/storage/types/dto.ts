import { IsOptional, IsString } from 'class-validator';

export class UpdateFileDto {
	@IsOptional()
	@IsString()
	name?: string;

	@IsOptional()
	@IsString()
	description?: string;
}
