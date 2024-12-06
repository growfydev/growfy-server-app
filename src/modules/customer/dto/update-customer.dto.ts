import {
    IsString,
    IsOptional,
    IsEnum
} from 'class-validator';
import { GlobalStatus } from '@prisma/client';

export class UpdateCustomerDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsEnum(GlobalStatus, {
        message: 'Invalid global status. Must be ACTIVE, INACTIVE, or DELETED'
    })
    globalStatus?: GlobalStatus;

    @IsOptional()
    @IsString()
    email?: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsOptional()
    metadata?: Record<string, any>;
}