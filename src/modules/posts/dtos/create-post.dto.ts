import { JsonValue } from '@prisma/client/runtime/library';
import {
	IsArray,
	ArrayNotEmpty,
	ValidateNested,
	IsNumber,
	IsObject,
	IsOptional,
	IsEmail,
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

	@IsOptional()
	@IsEmail({}, { each: true })
	readonly email?: string | string[];
}
