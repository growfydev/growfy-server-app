import { JsonValue } from '@prisma/client/runtime/library';
import { IsObject, IsNumber, IsOptional } from 'class-validator';

export class CreatePostDto {
	@IsObject()
	readonly content: Record<string, JsonValue>;

	@IsNumber()
	readonly provider: number;

	@IsNumber()
	readonly typePost: number;

	@IsNumber()
	@IsOptional()
	readonly unix?: number;
}
