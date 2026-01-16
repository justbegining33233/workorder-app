import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';

export function middleware(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: request.nextUrl.pathname.startsWith('/api/auth') ? 5 : 100,
  })(request);

  if (rateLimitResult) {
    return rateLimitResult;
  }

  // Clone the response
  const response = NextResponse.next();

  // Security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  // Content Security Policy
  response.headers.set('Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' ws: wss:;"
  );

  // CSRF Protection - Check for CSRF token on state-changing requests
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method) && !request.nextUrl.pathname.startsWith('/api/shops/register') && !request.nextUrl.pathname.startsWith('/api/shops/pending')) {
    const csrfToken = request.headers.get('x-csrf-token') || request.headers.get('csrf-token');
    const sessionToken = request.cookies.get('csrf-token')?.value;

    if (!csrfToken || !sessionToken || csrfToken !== sessionToken) {
      return NextResponse.json(
        { error: 'CSRF token validation failed' },
        { status: 403 }
      );
    }
  }

  // CORS headers (if needed for API)
  if (request.nextUrl.pathname.startsWith('/api/')) {
    response.headers.set('Access-Control-Allow-Origin', '*'); // Adjust for production
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token');
  }

  return response;
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};