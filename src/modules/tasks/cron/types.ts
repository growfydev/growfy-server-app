export interface RegisteredTask {
	instance: Record<string, (...args: unknown[]) => unknown>;
	method: string;
	cronExpression: string;
}
