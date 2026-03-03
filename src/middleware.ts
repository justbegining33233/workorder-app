import { NextRequest, NextResponse } from 'next/server';

// ─── Role definitions ────────────────────────────────────────────────────────

/** Which roles may access each top-level route prefix */
const ROUTE_ROLES: Record<string, string[]> = {
  '/admin':      ['admin', 'superadmin'],   // platform admins only
  '/shop':       ['shop'],                   // shop owner only
  '/tech':       ['tech'],                   // technicians only
  '/customer':   ['customer'],               // customers only
  '/manager':    ['manager'],                // managers only
  '/workorders': ['shop', 'manager', 'tech'], // operational shared section
  '/reports':    ['admin', 'shop', 'manager'], // reporting shared section
};

/** Where to send a logged-in user based on their role */
const ROLE_HOME: Record<string, string> = {
  admin:      '/admin/home',
  superadmin: '/admin/home',
  shop:       '/shop/home',
  manager:    '/manager/home',
  tech:       '/tech/home',
  customer:   '/customer/dashboard',
};

// ─── JWT payload decode (no signature verify — routing only) ─────────────────
// Signature is still verified on every real API call via authenticateRequest().
// Here we only need the role claim to decide where to send the browser.

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    // atob is available in the Edge runtime
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

// ─── Middleware ───────────────────────────────────────────────────────────────

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Find the route group this path belongs to
  const entry = Object.entries(ROUTE_ROLES).find(([prefix]) =>
    pathname.startsWith(prefix)
  );

  // Not a protected route — pass through
  if (!entry) return NextResponse.next();

  const [, allowedRoles] = entry;

  // Read token from cookie (set by every login route) or Authorization header
  const token =
    request.cookies.get('sos_auth')?.value ??
    request.headers.get('authorization')?.replace('Bearer ', '');

  // No token → send to login, preserving the intended destination
  if (!token) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const payload = decodeJwtPayload(token);
  const role = payload?.role as string | undefined;

  // Unreadable token → send to login
  if (!role) {
    const loginUrl = new URL('/auth/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Role is permitted for this route → let through
  if (allowedRoles.includes(role)) return NextResponse.next();

  // Wrong role → bounce to their own dashboard (not to login)
  const home = ROLE_HOME[role] ?? '/auth/login';
  return NextResponse.redirect(new URL(home, request.url));
}

// Only run on page routes, not on API calls, static files, etc.
export const config = {
  matcher: [
    '/admin/:path*',
    '/shop/:path*',
    '/tech/:path*',
    '/customer/:path*',
    '/manager/:path*',
    '/workorders/:path*',
    '/reports',
  ],
};
