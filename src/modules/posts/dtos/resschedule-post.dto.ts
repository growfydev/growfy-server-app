import { IsNumber, IsOptional, IsPositive } from 'class-validator';

export class ReschedulePostDto {
	@IsNumber()
	@IsPositive()
	newUnixTime: number;

	@IsOptional()
	email: string | string[];
}
