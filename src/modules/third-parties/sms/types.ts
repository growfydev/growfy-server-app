export interface MessageSendResult {
	phoneNumber: string;
	username: string; // Added username to the result
	status: 'success' | 'failed';
	error?: string;
}

export interface MassMessageRequest {
	phoneNumbers: string[];
	message: string;
	username: string; // Added username as a required field
	batchSize?: number;
}
