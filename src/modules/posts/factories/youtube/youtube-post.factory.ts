import { PostEditor } from '../common/post-factory/post.editor.interface';
import { PostFactory } from '../common/post-factory/post.factory';
import { PostPublisher } from '../common/post-factory/post.publisher.interface';
import { PostValidationProperties } from '../common/post-factory/post.validationProperties.interface';
import { YotubeEditor } from './youtube.editor';
import { YouTubePublisher } from './youtube.publisher';
import { FacebookValidationProperties } from './youtube.validationProperties';

export class FacebookPostFactory implements PostFactory {
	createPublisher(): PostPublisher {
		return new YouTubePublisher();
	}

	createEditor(): PostEditor {
		return new YotubeEditor();
	}

	validationProperties(): PostValidationProperties {
		return new FacebookValidationProperties();
	}
}
