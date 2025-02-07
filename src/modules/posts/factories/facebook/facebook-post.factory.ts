import { PostEditor } from '../common/post-factory/post.editor.interface';
import { PostFactory } from '../common/post-factory/post.factory';
import { PostPublisher } from '../common/post-factory/post.publisher.interface';
import { PostValidationProperties } from '../common/post-factory/post.validationProperties.interface';
import { FacebookEditor } from './facebook.editor';
import { FacebookPublisher } from './facebook.publisher';
import { FacebookValidationProperties } from './facebook.validationProperties';

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
