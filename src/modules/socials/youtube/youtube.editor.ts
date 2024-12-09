import { JsonValue } from '@prisma/client/runtime/library';
import { PostEditor } from '../common/post-factory/post.editor.interface';
import { Service } from 'src/service';

export class YoutubeEditor extends Service implements PostEditor {
	constructor() {
		super(YoutubeEditor.name);
	}
	async edit(fields: JsonValue): Promise<void> {
		this.logger.log('Editando post en Facebook:', fields);
	}
}
