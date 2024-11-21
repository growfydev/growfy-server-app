import { IsString, IsNotEmpty } from 'class-validator';

export class SchedulePostDto {
  @IsString()
  @IsNotEmpty()
  readonly content: string;

  @IsString()
  @IsNotEmpty()
  readonly platform: string;

  @IsString()
  @IsNotEmpty()
  readonly scheduleTime: string;
}
