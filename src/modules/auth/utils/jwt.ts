import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET_KEY || 'your_secret_key';
const REFRESH_SECRET_KEY = process.env.JWT_REFRESH_SECRET_KEY || 'your_refresh_secret_key';

export function generateAccessToken(userId: number): string {
  return jwt.sign({ userId }, SECRET_KEY, { expiresIn: '1h' });
}

export function generateRefreshToken(userId: number): string {
  return jwt.sign({ userId }, REFRESH_SECRET_KEY, { expiresIn: '7d' });
}

export const jwtConstants = (configService: ConfigService) => ({
  secret: configService.get<string>('JWT_SECRET'),
});
