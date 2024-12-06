import {
	Controller,
	Post,
	Query,
	HttpException,
	HttpStatus,
} from '@nestjs/common';
import { TiktokService } from './tiktok.service';

@Controller('tiktok')
export class TiktokController {
	constructor(private readonly tiktokService: TiktokService) {}

	@Post('auth')
	async authenticate(@Query('code') code: string) {
		try {
			const token = await this.tiktokService.getAccessToken(code);
			return { accessToken: token };
		} catch (error) {
			throw new HttpException(
				error.message,
				HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}
}
