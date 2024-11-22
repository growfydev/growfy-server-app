import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { AuthenticateDto, RegisterDto, Verify2FADto, TokensDto, CompleteRegistrationDto } from './types/dto';
import { ResponseMessage } from 'src/decorators/responseMessage.decorator';
import { ActiveUser } from './decorators/session.decorator';
import { Auth } from './decorators/auth.decorator';
import { CoreRole } from '@prisma/client';
import { TwoFactorAuthService } from './services/two-factor-auth.service';
import { AuthService } from './services/auth.service';
import { UserType } from './types/auth';

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

    @Post('complete-registration/:email')
    @ResponseMessage('User registration completed successfully')
    async completeRegistration(
        @Param('email') email: string,
        @Body() dto: CompleteRegistrationDto,
    ) {
        return this.authService.completeRegistration(email, dto);
    }

    @Post('login')
    @ResponseMessage('User logged in successfully')
    async login(@Body() authenticateDto: AuthenticateDto): Promise<TokensDto> {
        return this.authService.authenticate(authenticateDto);
    }

    @Get('me')
    @Auth([CoreRole.USER, CoreRole.ADMIN])
    @ResponseMessage('User details retrieved successfully')
    async me(@ActiveUser() user: UserType) {
        return this.authService.getProfile(user.id);
    }

    @Post('otp/enable')
    @Auth([CoreRole.USER, CoreRole.ADMIN])
    @ResponseMessage('2FA enabled successfully')
    async enable2FA(@ActiveUser() user: UserType) {
        const { qrCodeUrl, base32 } = await this.twoFactorAuthService.enable2FA(user.id);

        return {
            qrCodeUrl,
            base32,
        };
    }

    @Post('otp/verify')
    @Auth([CoreRole.USER, CoreRole.ADMIN])
    @ResponseMessage('OTP verification process completed')
    async verify2FA(@ActiveUser() user: UserType, @Body() dto: Verify2FADto) {
        const isVerified = await this.twoFactorAuthService.verify2FAToken(user.id, dto.token);

        return { isVerified };
    }
}
