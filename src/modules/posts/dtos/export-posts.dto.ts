import { IsArray, IsDateString, IsOptional, ValidateIf } from 'class-validator';

export class ExportPostsDto {
	@IsDateString()
	startDate: string;

	@IsDateString()
	endDate: string;

	@IsArray()
	@IsOptional()
	@ValidateIf((dto) => dto.providerIds !== undefined) // Permite arrays vacíos
	providerIds?: number[];

	formatId: number;
}
