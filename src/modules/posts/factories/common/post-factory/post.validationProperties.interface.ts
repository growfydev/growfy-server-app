import { JsonValue } from '@prisma/client/runtime/library';

export interface PostValidationProperties {
	validation(
		typePostName: string,
		fields: JsonValue,
		properties: JsonValue,
	): Promise<void>;
}
