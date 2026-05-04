import { NextRequest, NextResponse } from 'next/server';
import { isPathAllowedForPlan, getRequiredFeatureForPath } from '@/lib/subscription-access';
import type { SubscriptionPlan } from '@/lib/subscription';

// ─── Role definitions ────────────────────────────────────────────────────────

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

const SHOP_SUBSCRIPTION_EXEMPT_PATHS = ['/shop/subscribe', '/shop/settings'];

// ─── JWT signature verification (Web Crypto API — Edge-compatible) ───────────

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

    // Signature valid — decode payload
    const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(payloadBase64)) as Record<string, unknown>;

    // Respect token expiration when present.
    const exp = payload.exp;
    if (typeof exp === 'number' && Date.now() >= exp * 1000) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

// ─── Proxy ───────────────────────────────────────────────────────────────────

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow unauthenticated access to role-specific login pages
  if (pathname === '/admin/login') return NextResponse.next();

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

  const payload = await verifyJwt(token);
  const role = payload?.role as string | undefined;

  // Unreadable token → send to login
  if (!role) {
    const loginUrl = new URL('/auth/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Role is permitted for this route → let through
  if (allowedRoles.includes(role)) {
    if (pathname.startsWith('/admin/owner') && payload?.isOwner !== true) {
      return NextResponse.redirect(new URL('/admin/home', request.url));
    }

    // Shop owners must have an active/trialing subscription before using shop app routes.
    if (role === 'shop') {
      const isExempt = SHOP_SUBSCRIPTION_EXEMPT_PATHS.some((p) => pathname.startsWith(p));

      if (!isExempt) {
        try {
          const checkUrl = new URL('/api/auth/subscription-gate', request.url);
          const gateResponse = await fetch(checkUrl.toString(), {
            method: 'GET',
            headers: {
              authorization: `Bearer ${token}`,
            },
            cache: 'no-store',
          });

          if (!gateResponse.ok) {
            const subscribeUrl = new URL('/shop/subscribe', request.url);
            subscribeUrl.searchParams.set('reason', 'subscription_required');
            return NextResponse.redirect(subscribeUrl);
          }

          const gate = (await gateResponse.json()) as { allowed?: boolean; reason?: string; plan?: SubscriptionPlan | null };
          if (!gate.allowed) {
            const subscribeUrl = new URL('/shop/subscribe', request.url);
            subscribeUrl.searchParams.set('reason', String(gate.reason ?? 'subscription_required'));
            subscribeUrl.searchParams.set('redirect', pathname);
            return NextResponse.redirect(subscribeUrl);
          }

          // Route-level feature lock by subscription plan.
          if (gate.plan && ['shop', 'manager', 'tech'].includes(role)) {
            const allowedByPlan = isPathAllowedForPlan(pathname, gate.plan);
            if (!allowedByPlan) {
              const requiredFeature = getRequiredFeatureForPath(pathname);

              if (role === 'shop') {
                const subscribeUrl = new URL('/shop/subscribe', request.url);
                subscribeUrl.searchParams.set('reason', 'feature_locked');
                if (requiredFeature) subscribeUrl.searchParams.set('feature', requiredFeature);
                subscribeUrl.searchParams.set('redirect', pathname);
                return NextResponse.redirect(subscribeUrl);
              }

              const home = ROLE_HOME[role] ?? '/auth/login';
              const homeUrl = new URL(home, request.url);
              homeUrl.searchParams.set('reason', 'feature_locked');
              if (requiredFeature) homeUrl.searchParams.set('feature', requiredFeature);
              return NextResponse.redirect(homeUrl);
            }
          }
        } catch {
          const subscribeUrl = new URL('/shop/subscribe', request.url);
          subscribeUrl.searchParams.set('reason', 'subscription_check_failed');
          return NextResponse.redirect(subscribeUrl);
        }
      }
    }

    return NextResponse.next();
  }

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
    '/reports/:path*',
  ],
};