import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EmailService } from '../email/email.service';
import {
	PostScheduledPayload,
	PostPublishedPayload,
	PostRescheduledPayload,
	EmailSentPayload,
} from './interface/notification.payloads';

@Injectable()
export class NotificationService {
	constructor(private readonly emailService: EmailService) {}

	private sendEmail(to: string | string[], subject: string, text: string) {
		if (Array.isArray(to)) {
			to.forEach((email) => {
				this.emailService.to(email).subject(subject).text(text).send();
			});
		} else {
			this.emailService.to(to).subject(subject).text(text).send();
		}
	}

	@OnEvent('post.scheduled')
	handlePostScheduledEvent(payload: PostScheduledPayload) {
		this.sendEmail(
			payload.email,
			'Nueva publicación programada',
			`Se ha programado una nueva publicación con ID: ${payload.postId}`,
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
