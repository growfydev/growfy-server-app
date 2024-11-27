import { IsString, IsObject, IsNumber, IsOptional } from 'class-validator';


export class CreatePostDto {
  @IsObject()
  readonly content: Record<string, any>;

  @IsNumber()
  readonly provider: number;

  @IsString()
  readonly typePost: string;

  @IsNumber()
  @IsOptional()
  readonly unix?: number;
}
