import { PostEditor } from './post.editor.interface';
import { PostPublisher } from './post.publisher.interface';
import { PostValidationProperties } from './post.validationProperties.interface';

export interface PostFactory {
	createPublisher(): PostPublisher;
	createEditor(): PostEditor;
	validationProperties(): PostValidationProperties;
}
