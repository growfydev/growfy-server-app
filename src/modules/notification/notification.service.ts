import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EmailService } from '../email/email.service';
import {
	PostScheduledPayload,
	PostPublishedPayload,
	PostRescheduledPayload,
	EmailSentPayload,
} from './interface/notification.payloads';
import { Service } from 'src/service';

@Injectable()
export class NotificationService extends Service {
	constructor(private readonly emailService: EmailService) {
		super(NotificationService.name);
	}

	private sendEmail(to: string | string[], subject: string, text: string) {
		if (!to || (Array.isArray(to) && to.length === 0)) {
			this.logger.error('No recipients provided for email');
			return;
		}

		if (Array.isArray(to)) {
			to.forEach((email) => {
				this.emailService.to(email).subject(subject).text(text).send();
			});
		} else {
			this.emailService.to(to).subject(subject).text(text).send();
		}
		this.logger.log(`Email sent to ${to}`);
	}

	@OnEvent('post.scheduled')
	handlePostScheduledEvent(payload: PostScheduledPayload) {
		const postIds = payload.postIds.join(', ');
		this.sendEmail(
			payload.email,
			'Nueva publicación programada',
			`Se ha programado una nueva publicación con ID: ${postIds}`,
		);
	}

	@OnEvent('post.published')
	handlePostPublishedEvent(payload: PostPublishedPayload) {
		this.sendEmail(
			payload.email,
			'Publicación realizada',
			`Se ha publicado el post con ID: ${payload.postId}`,
		);
	}

	@OnEvent('post.rescheduled')
	handlePostRescheduledEvent(payload: PostRescheduledPayload) {
		this.sendEmail(
			payload.email,
			'Publicación reprogramada',
			`Se ha reprogramado el post con ID: ${payload.postId}`,
		);
	}

	@OnEvent('email.sent')
	handleEmailSentEvent(payload: EmailSentPayload) {
		this.sendEmail(
			payload.email,
			'Nuevo correo enviado',
			`Se ha enviado un nuevo correo a: ${payload.email}`,
		);
	}
}
