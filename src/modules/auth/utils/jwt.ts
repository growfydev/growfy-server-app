import * as jwt from 'jsonwebtoken';
import { configLoader } from 'src/lib/config.loader';

const SECRET_KEY = configLoader().jwt.secret_key;
const REFRESH_SECRET_KEY = configLoader().jwt.refresh_key;

/**
 * Generate Access Token
 * @param userId - Unique identifier for the user
 * @param userRoles - User's roles and associated profile information
 * @returns Signed JWT access token
 */
export function generateAccessToken(
  userId: number,
  userRoles: {
    userRole: string;
    profiles: { profileId: number; profileName: string; memberRole: string; permissions: string[] }[];
  }
): string {
  return jwt.sign(
    {
      userId,
      userRoles: {
        userRole: userRoles.userRole,
        profiles: userRoles.profiles,
      },
    },
    SECRET_KEY,
    { expiresIn: '1h' }
  );
}

/**
 * Generate Refresh Token
 * @param userId - Unique identifier for the user
 * @param fingerprint - Optional fingerprint hash for additional security
 * @returns Signed JWT refresh token
 */
export function generateRefreshToken(userId: number, fingerprint?: string): string {
  const payload: Record<string, any> = {
    userId,
    iat: Math.floor(Date.now() / 1000),
  };

  if (fingerprint) {
    payload.fingerprint = fingerprint;
  }

  try {
    return jwt.sign(payload, REFRESH_SECRET_KEY, { expiresIn: '7d' });
  } catch (error) {
    console.error('Error generating refresh token:', error);
    throw new Error('Could not generate refresh token');
  }
}
