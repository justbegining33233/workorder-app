/**
 * Auth middleware utilities — canonical implementation lives in @/lib/auth.
 * This module re-exports for backwards compatibility so existing imports
 * from '@/lib/middleware' continue to work without changes.
 */
export {
  type AuthUser,
  getAuthToken,
  authenticateRequest,
  requireRole,
} from './auth';

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest as _authenticateRequest } from './auth';

/**
 * requireAuth — convenience wrapper that returns 401 if not authenticated.
 * This function exists only in middleware.ts (not in auth.ts) for backwards compat.
 */
export function requireAuth(request: NextRequest): NextResponse | import('./auth').AuthUser {
  const user = _authenticateRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return user;
}
