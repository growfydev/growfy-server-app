import { IsNumber, IsPositive } from 'class-validator';

export class ReschedulePostDto {
	@IsNumber()
	@IsPositive()
	newUnixTime: number;
}
