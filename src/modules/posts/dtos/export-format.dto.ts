import { Prisma } from '@prisma/client';

export interface Post {
	id: number;
	ProviderPostType: {
		provider: {
			name: string;
		};
		posttype: {
			name: string;
		};
	};
	createdAt: Date;
	profile: {
		name: string;
	};
	task?: {
		status: string;
	};
	fields: Prisma.JsonValue;
}
