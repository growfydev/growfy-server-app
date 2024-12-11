import { PostWithRelationsForExport } from '../dtos/transformed-post.interface';

export interface ExportResult {
	fileBuffer: Buffer;
	header: { 'Content-Type': string };
}

export interface Exporter {
	export(posts: PostWithRelationsForExport[]): Promise<ExportResult>;
}
