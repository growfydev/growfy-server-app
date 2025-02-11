export interface CampaignSettings {
	title: string;
	subject_line: string;
}

export interface CampaignRecipients {
	recipient_count: number;
}

export interface CampaignReportSummary {
	open_rate: number;
	click_rate: number;
	bounce_rate?: number;
}

export interface Campaign {
	settings: CampaignSettings;
	status: string;
	send_time: string;
	recipients: CampaignRecipients;
	report_summary: CampaignReportSummary;
}

export interface CampaignsResponse {
	campaigns: Campaign[];
}
