import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/core/prisma.service';
import { generateRandomBase32 } from './utils/crypt';
import { createTOTP, generateQRCodeUrl } from './utils/2fa';

@Injectable()
export class TwoFactorAuthService {
    constructor(private prisma: PrismaService) { }
    /**
     * Genera el secreto TOTP y el código QR para configurar 2FA.
     * @param userId ID del usuario.
     * @returns URL del código QR y el secreto base32.
     */

    async generateTwoFASecret(userId: number): Promise<{ qrCodeUrl: string; base32: string }> {
        const base32Secret = generateRandomBase32();
        const totp = createTOTP(base32Secret, `user-${userId}`, 'YourAppName');
        const otpauthUrl = totp.toString();


        await this.prisma.user.update({
            where: { id: userId },
            data: {
                otp_base32: base32Secret,
                otp_auth_url: otpauthUrl,
            },
        });

        const qrCodeUrl = await generateQRCodeUrl(otpauthUrl);

        return {
            qrCodeUrl,
            base32: base32Secret,
        };
    }

    /**
     * Verifica el token TOTP proporcionado por el usuario.
     * @param userId ID del usuario.
     * @param token Token TOTP proporcionado.
     * @returns Verdadero si el token es válido.
     */
    async verify2FAToken(userId: number, token: string): Promise<boolean> {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });

        if (!user) {
            throw new UnauthorizedException('User does not exist');
        }

        if (!user.otp_base32) {
            throw new UnauthorizedException('2FA is not enabled for this user');
        }

        const totp = createTOTP(user.otp_base32, user.email, 'Growly');

        const delta = totp.validate({ token });

        if (delta === null) {
            throw new UnauthorizedException('Invalid OTP token');
        }

        await this.prisma.user.update({
            where: { id: userId },
            data: {
                otp_enabled: true,
                otp_verified: true,
            },
        });

        return true;
    }


    /**
     * Habilita 2FA para un usuario y devuelve el código QR.
     * @param userId ID del usuario.
     * @returns URL del código QR.
     */
    async enable2FA(userId: number): Promise<{ qrCodeUrl: string; base32: string }> {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });

        if (user?.otp_enabled) {
            throw new BadRequestException('2FA is already enabled for this user');
        }
        return this.generateTwoFASecret(userId);
    }
}

