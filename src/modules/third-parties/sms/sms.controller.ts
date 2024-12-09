import { Body, Controller, Post } from '@nestjs/common';
import { SmsService } from './sms.service';

@Controller('notifications')
export class SmsController {
	constructor(private twilioService: SmsService) {}

	@Post('/send-sms')
	async sendNotification(@Body() body: { to: string; message: string }) {
		const { to, message } = body;

		// Validar número de teléfono antes de enviar
		const isValidNumber = await this.twilioService.validatePhoneNumber(to);

		if (!isValidNumber) {
			throw new Error('Número de teléfono inválido');
		}

		await this.twilioService.sendSms(to, message);
		return { success: true, message: 'SMS enviado correctamente' };
	}
}
