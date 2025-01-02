import { JsonValue } from '@prisma/client/runtime/library';
import {
	IsObject,
	IsNumber,
	IsOptional,
	IsArray,
	ArrayNotEmpty,
	ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class ProviderContent {
	@IsNumber()
	provider: number;

	@IsNumber()
	typePost: number;

	@IsObject()
	content: Record<string, JsonValue>;
}

export class CreatePostDto {
	@IsArray()
	@ArrayNotEmpty()
	@ValidateNested({ each: true })
	@Type(() => ProviderContent)
	readonly providerContents: ProviderContent[];

	@IsNumber()
	@IsOptional()
	readonly unix?: number;
}
