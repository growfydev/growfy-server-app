import { IsEmail, IsEnum, IsInt, IsOptional } from 'class-validator';
import { ProfileMemberRoles } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class InviteUserDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsInt()
  @IsOptional()
  profileId?: number;

  @ApiProperty()
  @IsEnum(ProfileMemberRoles)
  role: ProfileMemberRoles;
}
