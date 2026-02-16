import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './auth';

export interface AuthUser {
  id: string;
  email: string;
  role: 'customer' | 'tech' | 'manager' | 'admin' | 'shop' | 'superadmin';
  shopId?: string;
}

export function getAuthToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Also check for sos_auth cookie
  const sosAuthCookie = request.cookies.get('sos_auth')?.value;
  if (sosAuthCookie) {
    return sosAuthCookie;
  }
  
  return null;
}

export function authenticateRequest(request: NextRequest): AuthUser | null {
  const token = getAuthToken(request);
  if (!token) return null;
  
  const payload = verifyToken(token);
  if (!payload) return null;
  
  return payload as AuthUser;
}

export function requireAuth(request: NextRequest): NextResponse | AuthUser {
  const user = authenticateRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return user;
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
