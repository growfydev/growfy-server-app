import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

/**
 * Genera una clave secreta en formato base32 más segura.
 * @param {number} length Longitud deseada para la clave secreta en base32.
 * @returns Clave secreta base32.
 */
export function generateRandomBase32(length: number = 32): string {
  const buffer = crypto.randomBytes(Math.ceil((length * 5) / 8));
  const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let base32 = '';

  for (let i = 0; i < buffer.length; i++) {
    const byte = buffer[i];
    base32 += base32Chars[byte % 32];
  }

  return base32.substring(0, length);
}

/**
 * Hashea una contraseña usando bcrypt.
 * @param password Contraseña en texto plano.
 * @returns Contraseña hasheada.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

/**
 * Compara una contraseña en texto plano con una contraseña hasheada.
 * @param password Contraseña en texto plano.
 * @param hashedPassword Contraseña hasheada.
 * @returns Verdadero si coinciden.
 */
export async function comparePasswords(
  password: string,
  hashedPassword: string,
): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}
