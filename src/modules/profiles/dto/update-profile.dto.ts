import { PartialType } from '@nestjs/mapped-types';
import { CreateProfileDto } from './create-profile.dto';
import { IsOptional, IsString, IsEnum } from 'class-validator';
import { GlobalStatus } from '@prisma/client';

export class UpdateProfileDto extends PartialType(CreateProfileDto) {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(GlobalStatus)
  globalStatus?: GlobalStatus;
}
