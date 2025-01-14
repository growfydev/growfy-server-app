import { PostEditor } from '../common/post-factory/post.editor.interface';
import { PostFactory } from '../common/post-factory/post.factory';
import { PostPublisher } from '../common/post-factory/post.publisher.interface';
import { PostValidationProperties } from '../common/post-factory/post.validationProperties.interface';
import { FacebookEditor } from './youtube.editor';
import { FacebookPublisher } from './youtube.publisher';
import { FacebookValidationProperties } from './youtube.validationProperties';

export class FacebookPostFactory implements PostFactory {
	createPublisher(): PostPublisher {
		return new FacebookPublisher();
	}

	createEditor(): PostEditor {
		return new FacebookEditor();
	}

	validationProperties(): PostValidationProperties {
		return new FacebookValidationProperties();
	}
}
