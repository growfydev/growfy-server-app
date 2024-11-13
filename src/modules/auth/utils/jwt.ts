import * as jwt from 'jsonwebtoken';
import { configLoader } from 'src/lib/config.loader';

const SECRET_KEY = configLoader().jwt.secret_key;
const REFRESH_SECRET_KEY = configLoader().jwt.refresh_key;

export function generateAccessToken(userId: number): string {
  return jwt.sign({ userId }, SECRET_KEY, { expiresIn: '1h' });
}

export function generateRefreshToken(userId: number): string {
  return jwt.sign({ userId }, REFRESH_SECRET_KEY, { expiresIn: '7d' });
}