import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Reflector } from '@nestjs/core';
import { CRON_TASK_METADATA } from './cron.decorator';
import { Queues } from '../constants';
import { RegisteredTask } from './types';
import { Service } from 'src/service';

@Injectable()
export class CronTaskService extends Service implements OnApplicationBootstrap {
	private registeredTasks: RegisteredTask[] = [];

	constructor(
		private readonly reflector: Reflector,
		@InjectQueue(Queues.CRON) private readonly taskQueue: Queue,
	) {
		super(CronTaskService.name);
	}

	async onApplicationBootstrap(): Promise<void> {
		for (const task of this.registeredTasks) {
			const { cronExpression, method } = task;

			await this.taskQueue.add(
				method,
				{ methodName: method },
				{ repeat: { cron: cronExpression } },
			);

			this.logger.log(
				`Scheduled task: ${method} with cron ${cronExpression}`,
			);
		}
	}

	registerTask(instance: Record<string, unknown>): void {
		const prototype = Object.getPrototypeOf(instance);

		const methods = Object.getOwnPropertyNames(prototype).filter(
			(method) => {
				const metadata = this.reflector.get<{ cronExpression: string }>(
					CRON_TASK_METADATA,
					prototype[method],
				);
				return !!metadata;
			},
		);

		for (const method of methods) {
			const callableMethod = prototype[method];
			if (typeof callableMethod !== 'function') {
				this.logger.error(
					`Method ${method} is not a function. Cannot be registered.`,
				);
				continue;
			}

			const { cronExpression } = this.reflector.get<{
				cronExpression: string;
			}>(CRON_TASK_METADATA, callableMethod)!;

			this.registeredTasks.push({
				instance: instance as Record<
					string,
					(...args: unknown[]) => unknown
				>,
				method,
				cronExpression,
			});

			this.logger.log(
				`Registered task: ${method} with cron ${cronExpression}`,
			);
		}
	}

	async executeTask(jobData: { methodName: string }): Promise<void> {
		const { methodName } = jobData;

		for (const task of this.registeredTasks) {
			if (task.method === methodName) {
				const method = task.instance[methodName];
				this.logger.log(`Executing method: ${methodName}`);
				await method.call(task.instance);
			}
		}
	}
}
