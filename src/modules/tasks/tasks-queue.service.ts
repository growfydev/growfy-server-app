import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Service } from 'src/service';
import { PrismaService } from 'src/core/prisma.service';
import { $Enums } from '@prisma/client';
import { Queues } from './constants';

@Injectable()
export class TaskQueueService extends Service {
	constructor(
		@InjectQueue(Queues.TASK) private readonly taskQueue: Queue,
		private readonly prisma: PrismaService,
	) {
		super(TaskQueueService.name);
	}

	async scheduleTask(
		profileId: number,
		postId: number,
		unixTime: number,
	): Promise<void> {
		const delay = Math.max(unixTime * 1000 - Date.now(), 0);

		await this.taskQueue.add(
			'publishPost',
			{
				profileId,
				postId,
			},
			{
				delay,
			},
		);

		this.logger.debug(
			`New task added to the queue for profile id: ${profileId}, and post id ${postId}`,
		);
	}

	async rescheduleTask(
		profileId: number,
		postId: number,
		newUnixTime: number,
	): Promise<void> {
		const job = await this.taskQueue.getJobs(['delayed']);

		const existingJob = job.find(
			(j) => j.data.profileId === profileId && j.data.postId === postId,
		);

		if (!existingJob) {
			this.logger.warn(
				`No existing task found for profile id: ${profileId}, and post id: ${postId}`,
			);
			return;
		}

		await existingJob.remove();

		this.logger.debug(
			`Task removed for profile id: ${profileId}, and post id: ${postId}`,
		);

		const newDelay = Math.max(newUnixTime * 1000 - Date.now(), 0);

		await this.taskQueue.add(
			'publishPost',
			{
				profileId,
				postId,
			},
			{
				delay: newDelay,
			},
		);

		this.logger.debug(
			`Task rescheduled to a new time for profile id: ${profileId}, and post id: ${postId}`,
		);
	}

	async getPostStatus(id: number): Promise<{ status: $Enums.PostStatus }> {
		const post = await this.prisma.post.findUnique({
			where: {
				id: id,
			},
			select: {
				status: true,
			},
		});

		return { status: post.status };
	}
}
