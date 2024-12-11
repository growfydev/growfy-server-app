import { $Enums, Post, TaskStatus, Prisma, GlobalStatus } from '@prisma/client';
import { JsonValue } from '@prisma/client/runtime/library';
export interface TransformedPost {
	id: number;
	content: JsonValue;
	postTypeId: number;
	provider: string | undefined;
	postType: string | undefined;
	profileName: string | undefined;
	taskStatus: TaskStatus | undefined;
	taskUnix: number | undefined;
}

export interface postType {
	name: string;
	id: number;
	globalStatus: $Enums.GlobalStatus;
	createdAt: Date;
	updatedAt: Date | null;
}

export interface providerData {
	name: $Enums.ProviderNames;
	id: number;
	globalStatus: $Enums.GlobalStatus;
	createdAt: Date;
	updatedAt: Date | null;
}

export interface providerPostType {
	name: string;
	id: number;
	fields: JsonValue;
	providerId: number;
	posttypeId: number;
	characterLimit: number;
	characterKey: string;
}

export interface PostsIncludeQuery {
	posts: {
		include: {
			task: {
				select: {
					status: boolean;
					unix: boolean;
				};
			};
			ProviderPostType: {
				include: {
					provider: {
						select: {
							name: boolean;
						};
					};
					posttype: {
						select: {
							name: boolean;
						};
					};
				};
			};
		};
	};
}

export interface TaskFieldsSelect {
	status: boolean;
	unix: boolean;
}

export interface ProviderPostTypeFields {
	provider: {
		select: {
			name: boolean;
		};
	};
	posttype: {
		select: {
			name: boolean;
		};
	};
}

export interface PostWithRelations extends Post {
	profile: {
		socials: {
			providerId: number;
			access_token: string;
			accountId: string;
		}[];
	};
	ProviderPostType: {
		provider: {
			name: string;
			id: number;
		};
		posttype: {
			name: string;
		};
	};
}

export interface PublishData {
	typePostName: string;
	provider: {
		id: number;
		name: string;
	};
	accountId: string;
	token: string;
	fields: Prisma.JsonValue;
}

export interface PostWithTask extends Post {
	task: {
		id: number;
		status: TaskStatus;
		globalStatus: GlobalStatus;
		createdAt: Date;
		updatedAt: Date | null;
		unix: number;
		postId: number;
	} | null;
}

export interface DateRange {
	start: Date;
	end: Date;
}

export interface ExportFormatType {
	id: number;
	createdAt: Date;
	format: string;
}

export interface PostsQueryParams {
	profileId: number;
	dateRange: DateRange;
	providerIds?: number[];
}

export interface PostWithIncludes {
	id?: number;
	fields?: JsonValue;
	postTypeId?: number;
	ProviderPostType?: {
		provider: {
			name: string;
		};
		posttype: {
			name: string;
		};
	};
	profile?: {
		name: string;
	};
	task?: {
		status: TaskStatus;
		unix: number;
	};
}

export interface PostsWhereClause {
	profileId: number;
	createdAt: {
		gte: Date;
		lte: Date;
	};
	ProviderPostType?: {
		providerId: {
			in: number[];
		};
	};
}

export interface PostsIncludeClause {
	ProviderPostType: {
		include: {
			provider: true;
			posttype: true;
		};
	};
	profile: true;
	task: true;
	PostType: true;
}

export interface ExportRecord {
	startDate: Date;
	endDate: Date;
	posts: TransformedPost[];
	format: string;
}

export interface ExportResult {
	fileBuffer: Buffer;
	header: { 'Content-Type': string };
}

export interface PostWithRelationsForExport extends Post {
	profile?: {
		name: string;
	};
	ProviderPostType: {
		provider: { name: string };
		posttype: { name: string };
	};
	task?: {
		status: TaskStatus;
		unix: number;
	};
	posttype?: {
		name: string;
	};
}

export interface IExporter {
	export(posts: PostWithRelationsForExport[]): Promise<ExportResult>;
}

export interface Task {
	id: number;
	unix: number;
}
