import { JsonValue } from '@prisma/client/runtime/library';
import { PostData } from 'src/types/types';

export interface PostPublisher {
	publish(
		typePostName: string,
		fields: JsonValue,
		data: PostData,
	): Promise<void>;
}
