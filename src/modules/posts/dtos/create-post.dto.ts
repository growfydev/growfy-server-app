import { ProviderNames } from '@prisma/client';
import { IsString, IsObject, IsNumber, IsOptional } from 'class-validator';

export class CreatePostDto {
  @IsObject()
  readonly content: Record<string, any>; // Representa los campos dinámicos (fields).

  @IsString()
  readonly provider: ProviderNames; // Identifica el proveedor.

  @IsString()
  readonly typePost: string; // El nombre del tipo de post para las validaciones.

  @IsString()
  readonly status: string; // Estado inicial del post (por ejemplo: "DRAFT" o "PUBLISHED").

  @IsNumber()
  @IsOptional()
  readonly unix?: number; // Campo opcional para programar tareas relacionadas con el post.
}
