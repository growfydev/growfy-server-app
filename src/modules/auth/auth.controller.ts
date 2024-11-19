import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthenticateDto, RegisterDto, Enable2FADto, Verify2FADto, TokensDto } from './types/dto';
import { TwoFactorAuthService } from './two-factor-auth.service';
import { ResponseMessage } from 'src/decorators/responseMessage.decorator';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly twoFactorAuthService: TwoFactorAuthService
    ) { }

    @Post('register')
    @ResponseMessage('User registered successfully')
    register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }

    @Post('login')
    @ResponseMessage('User logged in successfully')
    async login(@Body() authenticateDto: AuthenticateDto): Promise<TokensDto> {
        return this.authService.authenticate(authenticateDto);
    }

    @Post('otp/enable')
    @ResponseMessage('2FA enabled successfully')
    async enable2FA(@Body() dto: Enable2FADto) {
        const { qrCodeUrl, base32 } = await this.twoFactorAuthService.enable2FA(dto.userId);

        return {
            qrCodeUrl,
            base32,
        };
    }

    @Post('otp/verify')
    @ResponseMessage('OTP verification process completed')
    async verify2FA(@Body() dto: Verify2FADto) {
        const isVerified = await this.twoFactorAuthService.verify2FAToken(dto.userId, dto.token);

        return { isVerified };
    }
}
