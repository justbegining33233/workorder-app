import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || '15m';
const DEFAULT_REFRESH_EXPIRES_DAYS = Number(process.env.REFRESH_EXPIRES_DAYS || '30');

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateAccessToken(payload: Record<string, any>): string {
  const options: SignOptions = { expiresIn: ACCESS_TOKEN_EXPIRES_IN as any };
  return jwt.sign(payload, JWT_SECRET, options);
}

// Backwards-compatible alias used by some routes
export const generateToken = generateAccessToken;

export function generateRandomToken(bytes = 48): string {
  return crypto.randomBytes(bytes).toString('hex');
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export function refreshExpiryDate(days = DEFAULT_REFRESH_EXPIRES_DAYS) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}
