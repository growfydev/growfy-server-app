import { Injectable } from '@nestjs/common';
import { configLoader } from 'src/lib/config.loader';
import * as twilio from 'twilio';

@Injectable()
export class SmsService {
	private twilioClient: twilio.Twilio;

	constructor() {
		this.twilioClient = twilio(
			configLoader().sms.accountSid,
			configLoader().sms.authToken,
		);
	}

	async sendSms(to: string, message: string): Promise<void> {
		try {
			await this.twilioClient.messages.create({
				body: message,
				from: configLoader().sms.from,
				to: to,
			});
		} catch (error) {
			console.error('Error enviando SMS:', error);
			throw new Error('No se pudo enviar el SMS');
		}
	}

	async validatePhoneNumber(phoneNumber: string): Promise<boolean> {
		try {
			// Valida el formato del número de teléfono
			const formattedNumber = this.formatPhoneNumber(phoneNumber);

			// Puedes agregar validaciones adicionales con la API de Twilio si lo deseas
			return formattedNumber.length > 10;
		} catch {
			return false;
		}
	}

	private formatPhoneNumber(phoneNumber: string): string {
		// Elimina caracteres no numéricos
		const cleanedNumber = phoneNumber.replace(/\D/g, '');

		// Agrega el código de país si no está presente
		return cleanedNumber.startsWith('+')
			? cleanedNumber
			: `+${cleanedNumber}`;
	}
}
