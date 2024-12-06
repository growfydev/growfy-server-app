export interface UploadOptions {
    title: string;
    description: string;
    privacyStatus?: 'private' | 'public' | 'unlisted';
    tags?: string[];
    categoryId?: string;
}