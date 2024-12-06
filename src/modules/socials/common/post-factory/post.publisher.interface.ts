import { PostData, PostFields } from '../../facebook/facebook.publisher';

export interface PostPublisher {
	publish(
		typePostName: string,
		fields: PostFields,
		data: PostData,
	): Promise<void>;
}
