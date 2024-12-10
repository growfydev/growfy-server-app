import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue, Job } from 'bull';
import { Service } from 'src/service';
import { PrismaService } from 'src/core/prisma.service';
import { $Enums } from '@prisma/client';
import { Queues, Tasks } from './constants';
import { TaskQueueJobData, PublishPostJobData } from './types';

@Injectable()
export class TaskQueueService extends Service {
	constructor(
		@InjectQueue(Queues.TASK)
		private readonly taskQueue: Queue<TaskQueueJobData>,
		private readonly prisma: PrismaService,
	) {
		super(TaskQueueService.name);
	}

	/**
	 * Schedules a new task in the queue.
	 * @param profileId - ID of the profile associated with the post.
	 * @param postId - ID of the post to be published.
	 * @param unixTime - The execution time as a Unix timestamp.
	 */
	async scheduleTask(
		profileId: number,
		postId: number,
		unixTime: number,
	): Promise<void> {
		const delay = this.calculateDelay(unixTime);

		await this.addTaskToQueue({ profileId, postId }, delay);

		this.logger.debug(
			`Task scheduled for profileId: ${profileId}, postId: ${postId}, delay: ${delay}ms`,
		);
	}

	/**
	 * Reschedules an existing task to a new time.
	 * @param profileId - ID of the profile associated with the post.
	 * @param postId - ID of the post to be rescheduled.
	 * @param newUnixTime - The new execution time as a Unix timestamp.
	 */
	async rescheduleTask(
		profileId: number,
		postId: number,
		newUnixTime: number,
	): Promise<void> {
		const existingJob = await this.findExistingJob(profileId, postId);

		if (!existingJob) {
			this.logger.warn(
				`No task found for profileId: ${profileId}, postId: ${postId}`,
			);
			return;
		}

		await existingJob.remove();
		this.logger.debug(
			`Task removed for profileId: ${profileId}, postId: ${postId}`,
		);

		const newDelay = this.calculateDelay(newUnixTime);
		await this.addTaskToQueue({ profileId, postId }, newDelay);

		this.logger.debug(
			`Task rescheduled for profileId: ${profileId}, postId: ${postId}, delay: ${newDelay}ms`,
		);
	}

	/**
	 * Retrieves the status of a post from the database.
	 * @param id - ID of the post to retrieve.
	 * @returns The status of the post.
	 */
	async getPostStatus(id: number): Promise<{ status: $Enums.PostStatus }> {
		const post = await this.prisma.post.findUnique({
			where: { id },
			select: { status: true },
		});

		if (!post) {
			throw new Error(`Post with id ${id} not found`);
		}

		return { status: post.status };
	}

	// ---------------------------------
	// Private Helper Methods
	// ---------------------------------

	/**
	 * Calculates the delay for a job based on the provided Unix timestamp.
	 * @param unixTime - The execution time as a Unix timestamp.
	 * @returns The delay in milliseconds.
	 */
	private calculateDelay(unixTime: number): number {
		return Math.max(unixTime * 1000 - Date.now(), 0);
	}

	/**
	 * Adds a task to the queue with the specified delay.
	 * @param data - The data for the task.
	 * @param delay - Delay in milliseconds.
	 */
	private async addTaskToQueue(
		data: PublishPostJobData,
		delay: number,
	): Promise<void> {
		await this.taskQueue.add(Tasks.PUBLISH_POST, data, { delay });
	}

	/**
	 * Finds an existing delayed job for the given profileId and postId.
	 * @param profileId - ID of the profile associated with the post.
	 * @param postId - ID of the post to find.
	 * @returns The found job or null if not found.
	 */
	private async findExistingJob(
		profileId: number,
		postId: number,
	): Promise<Job<PublishPostJobData> | null> {
		const jobs = await this.taskQueue.getJobs(['delayed']);
		return (
			jobs.find(
				(job) =>
					job.data.profileId === profileId &&
					job.data.postId === postId,
			) || null
		);
	}
}
