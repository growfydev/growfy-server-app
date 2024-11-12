import { Body, Controller, Get, Post, Put } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthenticateDto, RegisterDto, TokensDto } from './dto';
import { TwoFactorAuthService } from './two-factor-auth.service';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService, private readonly twoFactorAuthService: TwoFactorAuthService) { }

    @Post('register')
    register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }

    @Post('login')
    async login(@Body() authenticateDto: AuthenticateDto): Promise<TokensDto> {
        return this.authService.authenticate(authenticateDto);
    }

    @Post('enable-2fa')
    async enable2FA(@Body('userId') userId: number): Promise<string> {
      return this.twoFactorAuthService.enable2FA(userId);
    }
}
