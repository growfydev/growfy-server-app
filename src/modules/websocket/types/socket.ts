export interface CustomEventPayload {
	eventName: string;
	eventData: Record<string, object>;
}

export interface CustomEventResponse {
	message: string;
	data: CustomEventPayload;
}

export interface BroadcastEventPayload {
	eventName: string;
	eventData: Record<string, object>;
}

export interface EmitEventPayload {
	targetClientId?: string;
	event: string;
	data: Record<string, object>;
}
