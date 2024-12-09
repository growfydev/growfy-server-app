import { PostEditor } from '../../../socials/common/post-factory/post.editor.interface';
import { PostFactory } from '../../../socials/common/post-factory/post.factory';
import { PostPublisher } from '../../../socials/common/post-factory/post.publisher.interface';
import { FacebookEditor } from './facebook.editor';
import { FacebookPublisher } from './facebook.publisher';

export class FacebookPostFactory implements PostFactory {
	createPublisher(): PostPublisher {
		return new FacebookPublisher();
	}

	createEditor(): PostEditor {
		return new FacebookEditor();
	}
}
