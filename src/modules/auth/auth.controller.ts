import { Body, Controller, Get, Header, Headers, Param, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthenticateDto, RegisterDto, Enable2FADto, Verify2FADto, TokensDto, CompleteRegistrationDto } from './types/dto';
import { TwoFactorAuthService } from './two-factor-auth.service';
import { ResponseMessage } from 'src/decorators/responseMessage.decorator';
import { ActiveUser } from './decorators/session.decorator';
import { UserRoles } from './types/roles';
import { Auth } from './decorators/auth.decorator';
import { CoreRole } from '@prisma/client';

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
    async me(@ActiveUser() user: UserRoles) {
        return this.authService.getProfile(user.userId);
    }

    @Post('otp/enable')
    @Auth([CoreRole.USER, CoreRole.ADMIN])
    @ResponseMessage('2FA enabled successfully')
    async enable2FA(@ActiveUser() user: UserRoles) {
        const { qrCodeUrl, base32 } = await this.twoFactorAuthService.enable2FA(user.userId);

        return {
            qrCodeUrl,
            base32,
        };
    }

    @Post('otp/verify')
    @Auth([CoreRole.USER, CoreRole.ADMIN])
    @ResponseMessage('OTP verification process completed')
    async verify2FA(@ActiveUser() user: UserRoles, @Body() dto: Verify2FADto) {
        const isVerified = await this.twoFactorAuthService.verify2FAToken(user.userId, dto.token);

        return { isVerified };
    }
}
