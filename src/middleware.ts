import { NextRequest, NextResponse } from 'next/server';

// â”€â”€â”€ Role definitions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/** Which roles may access each top-level route prefix */
const ROUTE_ROLES: Record<string, string[]> = {
  '/admin':      ['admin', 'superadmin'],
  '/superadmin': ['superadmin'],
  '/shop':       ['shop',    'superadmin'],
  '/tech':       ['tech',    'superadmin'],
  '/customer':   ['customer','superadmin'],
  '/manager':    ['manager', 'superadmin'],
  '/workorders': ['shop', 'manager', 'tech', 'superadmin'],
  '/reports':    ['admin', 'shop', 'manager', 'superadmin'],
};

/** Where to send a logged-in user based on their role */
const ROLE_HOME: Record<string, string> = {
  admin:      '/admin/home',
  superadmin: '/superadmin/dashboard',
  shop:       '/shop/home',
  manager:    '/manager/home',
  tech:       '/tech/home',
  customer:   '/customer/dashboard',
};

// â”€â”€â”€ JWT signature verification (Web Crypto API â€” Edge-compatible) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

async function verifyJwt(token: string): Promise<Record<string, unknown> | null> {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) return null;

    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const encoder = new TextEncoder();

    // Import the HMAC key
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify'],
    );

    // Decode the signature from base64url
    const sigBase64 = parts[2].replace(/-/g, '+').replace(/_/g, '/');
    const sigBinary = Uint8Array.from(atob(sigBase64), (c) => c.charCodeAt(0));

    // Verify: HMAC-SHA256( header.payload, secret ) === signature
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      sigBinary,
      encoder.encode(`${parts[0]}.${parts[1]}`),
    );

    if (!valid) return null;

    // Signature valid â€” decode payload
    const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(payloadBase64));
  } catch {
    return null;
  }
}

// â”€â”€â”€ Middleware â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow unauthenticated access to role-specific login pages
  if (pathname === '/admin/login') return NextResponse.next();

  // Find the route group this path belongs to
  const entry = Object.entries(ROUTE_ROLES).find(([prefix]) =>
    pathname.startsWith(prefix)
  );

  // Not a protected route â€” pass through
  if (!entry) return NextResponse.next();

  const [, allowedRoles] = entry;

  // Read token from cookie (set by every login route) or Authorization header
  const token =
    request.cookies.get('sos_auth')?.value ??
    request.headers.get('authorization')?.replace('Bearer ', '');

  // No token â†’ send to login, preserving the intended destination
  if (!token) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const payload = await verifyJwt(token);
  const role = payload?.role as string | undefined;

  // Unreadable token â†’ send to login
  if (!role) {
    const loginUrl = new URL('/auth/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Role is permitted for this route â†’ let through
  if (allowedRoles.includes(role)) return NextResponse.next();

  // Wrong role â†’ bounce to their own dashboard (not to login)
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
    '/reports/:path*',
  ],
};
