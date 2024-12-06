import {
    IsString,
    IsOptional,
    IsArray,
    IsEnum
} from 'class-validator';

export class UploadVideoDto {
    @IsString()
    title: string;

    @IsString()
    description: string;

    @IsOptional()
    @IsEnum(['private', 'public', 'unlisted'])
    privacyStatus?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    tags?: string[];

    @IsOptional()
    @IsString()
    categoryId?: string;
}