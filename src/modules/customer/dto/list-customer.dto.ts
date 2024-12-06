import {
    IsOptional,
    IsInt,
    Min,
    IsEnum
} from 'class-validator';
import { GlobalStatus } from '@prisma/client';

export class ListCustomerDto {
    @IsOptional()
    @IsInt()
    @Min(1)
    page?: number = 1;

    @IsOptional()
    @IsInt()
    @Min(1)
    limit?: number = 10;

    @IsOptional()
    @IsEnum(GlobalStatus, {
        message: 'Invalid global status. Must be ACTIVE, INACTIVE, or DELETED'
    })
    status?: GlobalStatus;
}