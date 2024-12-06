import { JsonValue } from '@prisma/client/runtime/library';

export interface PostPublisher {
	publish(typePostName: string, fields: JsonValue, data: any): Promise<void>;
}
