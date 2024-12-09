import { PostEditor } from '../common/post-factory/post.editor.interface';
import { PostFactory } from '../common/post-factory/post.factory';
import { PostPublisher } from '../common/post-factory/post.publisher.interface';
import { YoutubeEditor } from './youtube.editor';
import { YoutubePublisher } from './youtube.publisher';

export class FacebookPostFactory implements PostFactory {
	createPublisher(): PostPublisher {
		return new YoutubePublisher();
	}

	createEditor(): PostEditor {
		return new YoutubeEditor();
	}
}
