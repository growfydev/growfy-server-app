import { JsonValue } from '@prisma/client/runtime/library';
import { PostValidationProperties } from '../common/post-factory/post.validationProperties.interface';

export class FacebookValidationProperties implements PostValidationProperties {
	async validation(
		typePostName: string,
		fields: JsonValue,
		properties: JsonValue,
	): Promise<void> {
		console.log('FacebookValidationProperties');
		console.log(typePostName);
		console.log(fields);
		console.log(properties);
	}
}
