import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthenticateDto, RegisterDto, Enable2FADto, Verify2FADto, TokensDto } from './dto';
import { TwoFactorAuthService } from './two-factor-auth.service';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly twoFactorAuthService: TwoFactorAuthService
    ) { }

    @Post('register')
    register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }

    @Post('login')
    async login(@Body() authenticateDto: AuthenticateDto): Promise<TokensDto> {
        return this.authService.authenticate(authenticateDto);
    }

    @Post('otp/enable')
    async enable2FA(@Body() dto: Enable2FADto) {
        const { qrCodeUrl, base32 } = await this.twoFactorAuthService.enable2FA(dto.userId);

        return {
            message: '2FA enabled successfully',
            qrCodeUrl,
            base32,
        };
    }

    @Post('otp/verify')
    async verify2FA(@Body() dto: Verify2FADto) {
        const isVerified = await this.twoFactorAuthService.verify2FAToken(dto.userId, dto.token);

        return {
            message: isVerified ? 'OTP verified successfully' : 'OTP verification failed',
        };
    }
}
