import { JsonValue } from '@prisma/client/runtime/library';
import { PostEditor } from '../common/post-factory/post.editor.interface';

export class FacebookEditor implements PostEditor {
	async edit(fields: JsonValue): Promise<void> {
		console.log('Editando post en Facebook:', fields);
	}
}
