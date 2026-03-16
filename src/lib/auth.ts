import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

const _jwtSecret = process.env.JWT_SECRET;
// Never throw at module-load time — this runs when the route is first imported
// (including during Vercel's build-time 'collect page data' step AND on cold-start
// serverless invocations where runtime env vars may not yet be injected).
// We warn loudly instead, and use a fallback so the app remains functional.
// For true production security, always set JWT_SECRET in your Vercel env vars.
if (!_jwtSecret) {
  console.error('[auth] WARNING: JWT_SECRET env var is not set. Using insecure fallback. Set JWT_SECRET in your environment.');
} else if (_jwtSecret.length < 32) {
  console.error(`[auth] WARNING: JWT_SECRET is too short (${_jwtSecret.length} chars). Minimum 32 recommended.`);
}
function getJwtSecret(): string {
  if (!_jwtSecret && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set in production');
  }
  return _jwtSecret || 'dev-only-insecure-secret-do-not-use-in-prod';
}
const JWT_SECRET = getJwtSecret();
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

/** Short-lived token for 2FA challenge step (default 5 minutes) */
export function generateTempToken(payload: Record<string, unknown>, expiresIn = '5m'): string {
  const options: SignOptions = { expiresIn: expiresIn as any };
  return jwt.sign(payload, JWT_SECRET, options);
}

// Backwards-compatible alias used by some routes
export const generateToken = generateAccessToken;

export function generateRandomToken(bytes = 48): string {
  return crypto.randomBytes(bytes).toString('hex');
}

export function verifyToken(token: string): any {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch {
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
  } catch {
    // If cookies API isn't available, fall back to parsing Cookie header
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(/sos_auth=([^;]+)/);
    if (match) return match[1];
  }

  return null;
}
