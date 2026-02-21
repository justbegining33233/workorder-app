import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

const fallbackJwt = 'fixtray-default-secret';
const JWT_SECRET = process.env.JWT_SECRET || fallbackJwt;
const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || '24h';
const DEFAULT_REFRESH_EXPIRES_DAYS = Number(process.env.REFRESH_EXPIRES_DAYS || '30');

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateAccessToken(payload: Record<string, unknown>): string {
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
    if (!process.env.JWT_SECRET) {
      console.warn('Auth - WARNING: JWT_SECRET not set in environment, using fallback secret. Set JWT_SECRET to a secure value in production.');
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    console.log('Auth - Token verification failed:', error instanceof Error ? error.message : String(error));
    return null;
  }
}

export function refreshExpiryDate(days = DEFAULT_REFRESH_EXPIRES_DAYS) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

export function authenticateRequest(request: NextRequest): AuthUser | null {
  const token = getAuthToken(request);
  if (!token) return null;
  
  const payload = verifyToken(token);
  if (!payload) return null;
  
  return payload as AuthUser;
}

export function requireRole(request: NextRequest, roles: string[]): NextResponse | AuthUser {
  const user = authenticateRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!roles.includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return user;
}

export interface AuthUser {
  id: string;
  email: string;
  role: 'customer' | 'tech' | 'manager' | 'admin' | 'shop' | 'superadmin';
  shopId?: string;
}

export function getAuthToken(request: NextRequest): string | null {
  // Prefer Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Check for sos_auth cookie (common login cookie)
  try {
    const sosAuthCookie = request.cookies.get('sos_auth')?.value;
    if (sosAuthCookie) return sosAuthCookie;
  } catch (e) {
    // If cookies API isn't available, fall back to parsing Cookie header
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(/sos_auth=([^;]+)/);
    if (match) return match[1];
  }

  return null;
}
