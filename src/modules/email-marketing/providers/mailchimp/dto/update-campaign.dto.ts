export class UpdateCampaignDto {
	title?: string;
	subjectLine?: string;
	previewText?: string;
}

export class UpdateCampaignRecipients {
	list_id?: string;
	segment_opts?: {
		saved_segment_id?: number;
		prebuilt_segment_id?: string;
		match?: string;
		conditions?: [null];
	};
}
