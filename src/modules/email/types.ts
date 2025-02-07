import { SentMessageInfo } from 'nodemailer';
import { Attachment } from 'nodemailer/lib/mailer';

export interface EmailBuilder {
	/**
	 * Sets the recipient email address.
	 * @param recipient - The email address of the recipient.
	 * @returns The current instance for chaining.
	 */
	to(recipient: string): this;

	/**
	 * Sets the subject of the email.
	 * @param subject - The subject of the email.
	 * @returns The current instance for chaining.
	 */
	subject(subject: string): this;

	/**
	 * Sets the plain text content of the email.
	 * @param content - The plain text content.
	 * @returns The current instance for chaining.
	 */
	text(content: string): this;

	/**
	 * Sets the HTML content of the email.
	 * @param content - The HTML content.
	 * @returns The current instance for chaining.
	 */
	html(content: string): this;

	/**
	 * Adds CC (carbon copy) recipients to the email.
	 * @param ccEmails - A single email address or an array of email addresses.
	 * @returns The current instance for chaining.
	 */
	cc(ccEmails: string | string[]): this;

	/**
	 * Adds BCC (blind carbon copy) recipients to the email.
	 * @param bccEmails - A single email address or an array of email addresses.
	 * @returns The current instance for chaining.
	 */
	bcc(bccEmails: string | string[]): this;

	/**
	 * Adds attachments to the email.
	 * @param attachments - An array of attachments with detailed properties.
	 * @returns The current instance for chaining.
	 */
	attachments(attachments: Attachment[]): this;

	/**
	 * Sends the email with the configured options.
	 * @returns A promise that resolves with the sent message information.
	 * @throws Error if required fields are missing.
	 */
	send(): Promise<SentMessageInfo>;

	/**
	 * Resets the email configuration to its default state.
	 * @returns The current instance for chaining.
	 */
	reset(): this;
}

/**
 * Options for the EmailModule.
 * @see {@link EmailModule}
 */

export interface EmailModuleOptions {
	host: string;
	port: number;
	secure: boolean;
	auth: {
		user: string;
		pass: string;
	};
}
