import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreatePostDto {

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  readonly content: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  readonly platform: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly mediaUrl?: string;
}
