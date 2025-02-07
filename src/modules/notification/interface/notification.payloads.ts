export interface PostScheduledPayload {
	postIds: number[];
	email: string | string[];
}

export interface PostPublishedPayload {
	postId: number;
	email: string | string[];
}

export interface PostRescheduledPayload {
	postId: number;
	email: string | string[];
}

export interface EmailSentPayload {
	email: string | string[];
}
