import { IsString, IsOptional } from 'class-validator';

export class UpdatePostDto {
	@IsString()
	@IsOptional()
	readonly content?: string;

	@IsString()
	@IsOptional()
	readonly mediaUrl?: string;

	@IsString()
	@IsOptional()
	readonly platform?: string;
}
