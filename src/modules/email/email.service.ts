import { Injectable, Inject } from '@nestjs/common';
import { Service } from 'src/service';
import { SentMessageInfo, Transporter } from 'nodemailer';
import * as nodemailer from 'nodemailer';
import { Attachment } from 'nodemailer/lib/mailer';
import { EmailBuilder, EmailModuleOptions } from './types';
import { EmailProvider } from './constants';

@Injectable()
export class EmailService extends Service implements EmailBuilder {
	private readonly transporter: Transporter;
	private emailOptions: Partial<nodemailer.SendMailOptions> = {};

	constructor(
		@Inject(EmailProvider.Options)
		private readonly options: EmailModuleOptions,
	) {
		super(EmailService.name);

		this.transporter = nodemailer.createTransport({
			host: options.host,
			port: options.port,
			secure: options.secure,
			auth: options.auth,
		});

		this.emailOptions.from = `"Growfy" <${options.auth.user}>`;
	}

	to(recipient: string): this {
		this.emailOptions.to = recipient;
		return this;
	}

	subject(subject: string): this {
		this.emailOptions.subject = subject;
		return this;
	}

	text(content: string): this {
		this.emailOptions.text = content;
		return this;
	}

	html(content: string): this {
		this.emailOptions.html = content;
		return this;
	}

	cc(ccEmails: string | string[]): this {
		this.emailOptions.cc = ccEmails;
		return this;
	}

	bcc(bccEmails: string | string[]): this {
		this.emailOptions.bcc = bccEmails;
		return this;
	}

	attachments(attachments: Attachment[]): this {
		this.emailOptions.attachments = attachments;
		return this;
	}

	reset(): this {
		this.emailOptions = {
			from: `"Growfy" <${this.options.auth.user}>`,
		};
		return this;
	}

	async send(): Promise<SentMessageInfo> {
		if (!this.emailOptions.to) {
			throw new Error('Recipient (to) is required');
		}
		const info: SentMessageInfo = await this.transporter.sendMail(
			this.emailOptions,
		);
		this.reset();
		return info;
	}
}
