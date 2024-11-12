import { BadRequestException, Injectable } from '@nestjs/common';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';
import { PrismaService } from 'src/core/prisma.service';

@Injectable()
export class TwoFactorAuthService {
    constructor(private prisma: PrismaService) { }

    async generateTwoFASecret(userId: number): Promise<string> {
        const secret = speakeasy.generateSecret({ length: 20 });

        await this.prisma.user.update({
            where: { id: userId },
            data: { twoFASecret: secret.base32 }
        });
        const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);

        return qrCodeUrl;
    }

    async verify2FAToken(userId: number, token: string): Promise<boolean> {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user?.twoFASecret) {
            throw new BadRequestException('No two-factor authentication secret found.');
        }

        const verified = speakeasy.totp.verify({
            secret: user.twoFASecret,
            encoding: 'base32',
            token,
        });

        return verified;
    }

    async enable2FA(userId: number): Promise<string> {
        const secret = speakeasy.generateSecret({ length: 20 });
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                twoFASecret: secret.base32,
                isTwoFAEnabled: true,
            },
        });

        const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);

        return qrCodeUrl;
    }
}
