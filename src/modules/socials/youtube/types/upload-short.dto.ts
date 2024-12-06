import { IsString, IsOptional, IsEnum } from 'class-validator';

export class UploadShortDto {
	@IsString()
	title: string;

	@IsString()
	description: string;

	@IsOptional()
	@IsEnum(['private', 'public', 'unlisted'])
	privacyStatus?: string;
	tags: any[];
}
