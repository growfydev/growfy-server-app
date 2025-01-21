import { SetMetadata } from '@nestjs/common';

export const CRON_TASK_METADATA = 'CRON_TASK_METADATA';

export function CronTask(cronExpression: string): MethodDecorator {
	return (target, propertyKey, descriptor) => {
		SetMetadata(CRON_TASK_METADATA, { cronExpression })(
			target,
			propertyKey,
			descriptor,
		);
	};
}
