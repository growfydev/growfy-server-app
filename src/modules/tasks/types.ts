export interface PublishPostJobData {
	profileId: number;
	postId: number;
}

export type TaskQueueJobData = PublishPostJobData;
