import { Injectable, Logger } from '@nestjs/common';
import { configLoader } from 'src/lib/ConfigLoader';
import * as twilio from 'twilio';
import { MassMessageRequest, MessageSendResult } from './types';

// Type Definitions

@Injectable()
export class SmsService {
	private readonly logger = new Logger(SmsService.name);
	private twilioClient: twilio.Twilio;

	constructor() {
		try {
			// Retrieve Twilio credentials from config
			const smsConfig = configLoader().sms;
			// Validate Twilio credentials
			if (!smsConfig.accountSid) {
				throw new Error('Twilio Account SID is required');
			}
			if (!smsConfig.authToken) {
				throw new Error('Twilio Auth Token is required');
			}
			if (!smsConfig.from) {
				throw new Error('Twilio "From" phone number is required');
			}

			// Initialize Twilio client
			this.twilioClient = twilio(
				smsConfig.accountSid,
				smsConfig.authToken,
			);

			this.logger.log('Twilio SMS service initialized successfully');
		} catch (error) {
			this.logger.error('Failed to initialize Twilio SMS service', error);
			throw new Error(`Twilio initialization failed: ${error.message}`);
		}
	}

	async sendSms(
		to: string,
		message: string,
		username: string,
	): Promise<void> {
		try {
			// Validate input
			if (!username) {
				throw new Error('Username is required');
			}

			const smsConfig = configLoader().sms;

			// Send SMS
			await this.twilioClient.messages.create({
				body: message,
				from: smsConfig.from,
				to: to,
				// Optional: Add username as messaging service configuration
				messagingServiceSid: username, // Use username as an additional identifier
			});

			this.logger.log(
				`SMS sent successfully to ${to} for user ${username}`,
			);
		} catch (error) {
			this.logger.error(`Error sending SMS for user ${username}`, error);
			throw new Error(`Failed to send SMS: ${error.message}`);
		}
	}

	async validatePhoneNumber(phoneNumber: string): Promise<boolean> {
		try {
			// Validate and format phone number
			const formattedNumber = this.formatPhoneNumber(phoneNumber);

			// Additional validation (you might want to use Twilio's phone number lookup service)
			return formattedNumber.length > 10;
		} catch (error) {
			this.logger.error(
				`Phone number validation error: ${error.message}`,
			);
			return false;
		}
	}

	private formatPhoneNumber(phoneNumber: string): string {
		// Remove non-numeric characters
		const cleanedNumber = phoneNumber.replace(/\D/g, '');

		// Add country code if not present
		return cleanedNumber.startsWith('+')
			? cleanedNumber
			: `+${cleanedNumber}`;
	}

	async sendMassMessages(
		massMessageRequest: MassMessageRequest,
	): Promise<MessageSendResult[]> {
		const {
			phoneNumbers,
			message,
			username,
			batchSize = 10,
		} = massMessageRequest;

		// Validate username
		if (!username) {
			throw new Error('Username is required for mass messaging');
		}

		const sendResults: MessageSendResult[] = [];

		// Process numbers in batches
		for (let i = 0; i < phoneNumbers.length; i += batchSize) {
			const batch = phoneNumbers.slice(i, i + batchSize);

			const batchResults = await Promise.all(
				batch.map(async (phoneNumber): Promise<MessageSendResult> => {
					try {
						const formattedNumber =
							this.formatPhoneNumber(phoneNumber);

						if (
							!(await this.validatePhoneNumber(formattedNumber))
						) {
							return {
								phoneNumber,
								username,
								status: 'failed',
								error: 'Invalid phone number',
							};
						}

						// Send individual message
						await this.sendSms(formattedNumber, message, username);

						return {
							phoneNumber,
							username,
							status: 'success',
						};
					} catch (error) {
						return {
							phoneNumber,
							username,
							status: 'failed',
							error: error.message,
						};
					}
				}),
			);

			sendResults.push(...batchResults);

			// Small pause between batches to avoid API limits
			await this.delay(1000);
		}

		return sendResults;
	}

	generateMassMessageReport(sendResults: MessageSendResult[]): {
		total: number;
		successful: number;
		failed: number;
		successRate: number;
		username: string;
	} {
		const total = sendResults.length;
		const successful = sendResults.filter(
			(result) => result.status === 'success',
		).length;
		const failed = total - successful;

		const username =
			sendResults.length > 0 ? sendResults[0].username : 'N/A';

		return {
			total,
			successful,
			failed,
			successRate: (successful / total) * 100,
			username,
		};
	}

	private delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
}
