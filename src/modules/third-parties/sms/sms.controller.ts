import {
	Body,
	Controller,
	Post,
	BadRequestException,
	InternalServerErrorException,
} from '@nestjs/common';
import { SmsService } from './sms.service';

@Controller('notifications')
export class SmsController {
	constructor(private twilioService: SmsService) {}

	@Post('/send-sms')
	async sendNotification(
		@Body() body: { to: string; message: string; username: string },
	) {
		const { to, message, username } = body;

		// Validaciones
		if (!username) {
			throw new BadRequestException('Username es requerido');
		}

		if (!to || !message) {
			throw new BadRequestException(
				'Número de teléfono y mensaje son requeridos',
			);
		}

		try {
			// Valida número de teléfono antes de enviar
			const isValidNumber =
				await this.twilioService.validatePhoneNumber(to);
			if (!isValidNumber) {
				throw new BadRequestException('Número de teléfono inválido');
			}

			// Envía SMS con username
			await this.twilioService.sendSms(to, message, username);

			return {
				success: true,
				message: 'SMS enviado correctamente',
				username,
			};
		} catch (error) {
			throw new InternalServerErrorException(
				error.message || 'Error al enviar SMS',
			);
		}
	}

	@Post('/send-mass-sms')
	async sendMassNotification(
		@Body()
		body: {
			phoneNumbers: string[];
			message: string;
			username: string;
			batchSize?: number;
		},
	) {
		const { phoneNumbers, message, username, batchSize } = body;

		// Validaciones
		if (!username) {
			throw new BadRequestException('Username es requerido');
		}

		if (!phoneNumbers || phoneNumbers.length === 0) {
			throw new BadRequestException(
				'Se requiere al menos un número de teléfono',
			);
		}

		if (!message) {
			throw new BadRequestException('El mensaje es requerido');
		}

		try {
			// Envío masivo de mensajes
			const sendResults = await this.twilioService.sendMassMessages({
				phoneNumbers,
				message,
				username,
				batchSize,
			});

			// Genera un reporte del envío
			const report =
				this.twilioService.generateMassMessageReport(sendResults);

			return {
				success: true,
				report,
				detailed_results: sendResults,
				username,
			};
		} catch (error) {
			throw new InternalServerErrorException(
				error.message || 'Error al enviar mensajes masivos',
			);
		}
	}
}
