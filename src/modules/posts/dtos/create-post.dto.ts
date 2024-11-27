import { IsString, IsObject, IsNumber, IsOptional } from 'class-validator';

export enum LocalProviderNames {
  FACEBOOK = 'facebook',
  TWITTER = 'twitter',
  INSTAGRAM = 'instagram',
  LINKEDIN = 'linkedIn',
}
export class CreatePostDto {
  @IsObject()
  readonly content: Record<string, any>; // Representa los campos dinámicos (fields).

  @IsString()
  readonly provider: LocalProviderNames; // Identifica el proveedor.

  @IsString()
  readonly typePost: string; // El nombre del tipo de post para las validaciones.

  @IsNumber()
  @IsOptional()
  readonly unix?: number; // Campo opcional para programar tareas relacionadas con el post.
}
