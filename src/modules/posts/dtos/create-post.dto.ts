import { IsObject, IsNumber, IsOptional } from 'class-validator';

export class CreatePostDto {
	@IsObject()
	readonly content: Record<string, unknown>;

	@IsNumber()
	readonly provider: number;

	@IsNumber()
	readonly typePost: number;

	@IsNumber()
	@IsOptional()
	readonly unix?: number;
}
