export interface GoogleDriveFile {
	id: string;
	name: string;
	mimeType: string;
	webViewLink?: string;
	thumbnailLink?: string;
	size?: string;
	createdTime?: string;
	modifiedTime?: string;
	owners?: Array<{
		displayName: string;
		emailAddress: string;
	}>;
	shared?: boolean;
	permissions?: Array<{
		role: string;
		type: string;
	}>;
}

export interface UpdatedFileResponse {
	id: string;
	name: string;
	mimeType: string;
	webViewLink?: string;
}

export interface DropboxFile {
	id: string;
	name: string;
	mimeType: string;
	webViewLink?: string | null;
}

export interface StorageFile {
	id: string;
	name: string;
	mimeType: string;
	webViewLink?: string | null;
}

export interface StorageListResponse {
	files: StorageFile[];
	nextPageToken?: string;
	hasMore?: boolean;
}
