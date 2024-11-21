import { PartialType } from '@nestjs/mapped-types';
import { CreateMemberDto } from './create-member.dto';
import { IsInt, IsEnum, IsOptional } from 'class-validator';
import { TeamRole, GlobalStatus } from '@prisma/client';

export class UpdateMemberDto extends PartialType(CreateMemberDto) {
    @IsOptional()
    @IsInt()
    userId?: number;

    @IsOptional()
    @IsInt()
    profileId?: number;

    @IsOptional()
    @IsEnum(TeamRole)
    role?: TeamRole;

    @IsOptional()
    @IsEnum(GlobalStatus)
    globalStatus?: GlobalStatus;
}
