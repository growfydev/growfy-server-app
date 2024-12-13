import { PostEditor } from '../common/post-factory/post.editor.interface';
import { PostFactory } from '../common/post-factory/post.factory';
import { PostPublisher } from '../common/post-factory/post.publisher.interface';
import { InstagramEditor } from './instagram.editor';
import { InstagramPublisher } from './instagram.publisher';

export class InstagramPostFactory implements PostFactory {
	createPublisher(): PostPublisher {
		return new InstagramPublisher();
	}

	createEditor(): PostEditor {
		return new InstagramEditor();
	}
}
