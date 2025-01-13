import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EmailService } from '../email/email.service';
import {
	EmailSentPayload,
	PostPublishedPayload,
	PostRescheduledPayload,
	PostScheduledPayload,
} from './interface/notification.payloads';

@Injectable()
export class NotificationService {
	constructor(private readonly emailService: EmailService) {}

	@OnEvent('post.scheduled')
	handlePostScheduledEvent(payload: PostScheduledPayload) {
		this.emailService
			.to(payload.email)
			.subject('Nueva publicación programada')
			.text(
				`Se ha programado una nueva publicación con ID: ${payload.postId}`,
			)
			.send();
	}

	@OnEvent('post.published')
	handlePostPublishedEvent(payload: PostPublishedPayload) {
		this.emailService
			.to(payload.email)
			.subject('Publicación realizada')
			.text(`Se ha publicado el post con ID: ${payload.postId}`)
			.send();
	}

	@OnEvent('post.rescheduled')
	handlePostRescheduledEvent(payload: PostRescheduledPayload) {
		this.emailService
			.to(payload.email)
			.subject('Publicación reprogramada')
			.text(`Se ha reprogramado el post con ID: ${payload.postId}`)
			.send();
	}

	@OnEvent('email.sent')
	handleEmailSentEvent(payload: EmailSentPayload) {
		this.emailService
			.to(payload.email)
			.subject('Nuevo correo enviado')
			.text(`Se ha enviado un nuevo correo a: ${payload.email}`)
			.send();
	}
}
