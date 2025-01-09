export interface PostScheduledPayload {
	postId: number;
	email: string;
}

export interface PostPublishedPayload {
	postId: number;
	email: string;
}

export interface PostRescheduledPayload {
	postId: number;
	email: string;
}

export interface EmailSentPayload {
	email: string;
}
