import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt, { type JwtPayload, type SignOptions } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET ?? 'guzo-dev-secret';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? 'guzo-refresh-secret';
const ACCESS_TTL = (process.env.JWT_ACCESS_TTL ?? '15m') as SignOptions['expiresIn'];
const REFRESH_TTL = (process.env.JWT_REFRESH_TTL ?? '7d') as SignOptions['expiresIn'];

export type AuthClaims = JwtPayload & {
  userId: string;
  role: string;
  email?: string | null;
  phone?: string;
};

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function signAccessToken(payload: Omit<AuthClaims, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TTL });
}

export function signRefreshToken(payload: Omit<AuthClaims, 'iat' | 'exp'>): string {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_TTL });
}

export function verifyAccessToken(token: string): AuthClaims {
  return jwt.verify(token, JWT_SECRET) as AuthClaims;
}

export function verifyRefreshToken(token: string): AuthClaims {
  return jwt.verify(token, REFRESH_SECRET) as AuthClaims;
}
