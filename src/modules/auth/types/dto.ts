import { ApiProperty } from '@nestjs/swagger';
import {
	IsEmail,
	IsNotEmpty,
	IsString,
	MinLength,
	IsOptional,
	IsNumber,
} from 'class-validator';

export class RegisterDto {
	@ApiProperty()
	@IsEmail()
	email: string;

	@ApiProperty()
	@IsString()
	@IsNotEmpty()
	name: string;

	@ApiProperty()
	@IsString()
	@IsOptional()
	phone?: string;

	@ApiProperty()
	@IsString()
	@MinLength(6)
	password: string;

	@ApiProperty()
	@IsString()
	@IsOptional()
	nameProfile?: string;
}

export class CompleteRegistrationDto {
	@ApiProperty()
	@IsString()
	@IsNotEmpty()
	name: string;

	@ApiProperty()
	@IsString()
	@MinLength(6)
	password: string;

	@ApiProperty()
	@IsString()
	@IsOptional()
	phone?: string;
}

export class AuthenticateDto {
	@ApiProperty()
	@IsEmail()
	@IsNotEmpty()
	email: string;

	@ApiProperty()
	@IsString()
	@IsNotEmpty()
	password: string;

	@ApiProperty()
	@IsString()
	@IsOptional()
	token2FA?: string;
}

export class TokensDto {
	@ApiProperty()
	@IsString()
	accessToken: string;

	@ApiProperty()
	@IsString()
	refreshToken: string;
}

export class Enable2FADto {
	@ApiProperty()
	@IsNumber()
	@IsNotEmpty()
	userId: number;
}

export class Verify2FADto {
	@ApiProperty()
	@IsString()
	@IsNotEmpty()
	token: string;
}
