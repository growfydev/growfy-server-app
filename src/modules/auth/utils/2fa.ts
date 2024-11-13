import * as OTPAuth from 'otpauth';
import * as qrcode from 'qrcode';

/**
 * Crea una instancia TOTP usando OTPAuth.
 * @param secret Clave secreta en formato base32.
 * @param label Etiqueta del usuario.
 * @param issuer Nombre de la aplicación.
 * @returns Instancia TOTP.
 */
export function createTOTP(secret: string, label: string, issuer: string): OTPAuth.TOTP {
    return new OTPAuth.TOTP({
        issuer,
        label,
        algorithm: 'SHA1',
        digits: 6,
        secret,
    });
}

/**
 * Genera una URL de código QR para configurar 2FA.
 * @param otpauthUrl URL en formato otpauth.
 * @returns URL del código QR.
 */
export async function generateQRCodeUrl(otpauthUrl: string): Promise<string> {
    return await qrcode.toDataURL(otpauthUrl);
}
