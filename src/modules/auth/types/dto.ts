import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, IsNumber } from "class-validator";

export class RegisterDto {
    @IsEmail()
    email: string;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @MinLength(6)
    password: string;
}

export class AuthenticateDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    password: string;

    @IsString()
    @IsOptional()
    token2FA?: string;
}

export class TokensDto {
    @IsString()
    accessToken: string;
    @IsString()
    refreshToken: string;
}

export class Enable2FADto {
    @IsNumber()
    @IsNotEmpty()
    userId: number;
}

export class Verify2FADto {
    @IsNumber()
    @IsNotEmpty()
    userId: number;

    @IsString()
    @IsNotEmpty()
    token: string;
}