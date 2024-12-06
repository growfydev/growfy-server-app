import { Post } from '../dtos/export-format.dto';

export interface Exporter {
	export(posts: Post[]): Promise<{
		fileBuffer: Buffer;
		header: { 'Content-Type': string };
	}>;
}
