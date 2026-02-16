import { NextRequest, NextResponse } from 'next/server';
// Lazy-load `prisma` and `bcrypt` inside the handler to avoid import-time issues
import { checkRateLimit, getClientIP, resetRateLimit } from '@/lib/rateLimit';

// @ts-ignore
import { generateAccessToken, generateRandomToken, refreshExpiryDate } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    // Lazy-load runtime-sensitive modules
    const prisma = (await import('@/lib/prisma')).default;
    const bcryptMod = await import('bcrypt');
    const bcrypt = (bcryptMod && (bcryptMod.default ?? bcryptMod)) as typeof import('bcrypt');

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    // Rate limiting - prevent brute force attacks
    const clientIP = getClientIP(request);
    const rateLimitKey = `admin_login:${clientIP}:${username}`;
    const rateLimit = checkRateLimit(rateLimitKey);
    
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: rateLimit.message, retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000) },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rateLimit.resetTime - Date.now()) / 1000)) } }
      );
    }

    // Find admin by username
    const admin = await prisma.admin.findUnique({
      where: { username }
    });

    if (!admin) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, admin.password);

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Successful login - reset rate limit
    resetRateLimit(rateLimitKey);

    // Generate short-lived access token
    const accessToken = generateAccessToken({ id: admin.id, username: admin.username, role: 'admin' });

    // Create refresh token (store hashed) and set httpOnly cookie. We store cookie as "<id>:<raw>"
    const refreshRaw = generateRandomToken(48);
    const refreshHash = await bcrypt.hash(refreshRaw, 12);
    const csrf = (await import('@/lib/csrf')).generateCsrfToken();
    const expiresAt = refreshExpiryDate();
    const userIp = request.headers.get('x-forwarded-for') || request.headers.get('host') || '';
    const userAgent = request.headers.get('user-agent') || '';
    console.log('Creating refresh token for admin:', admin.id);
    const refresh = await (prisma as any).refreshToken.create({
      data: {
        tokenHash: refreshHash,
        adminId: admin.id,
        metadata: JSON.stringify({ ip: userIp, agent: userAgent, csrfToken: csrf }),
        expiresAt,
      }
    });
    console.log('Refresh token created:', refresh.id);

    const response = NextResponse.json({
      id: admin.id,
      username: admin.username,
      email: admin.email,
      isSuperAdmin: admin.isSuperAdmin,
      role: 'admin',
      accessToken,
    });
    response.cookies.set('refresh_id', refresh.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: Math.floor((expiresAt.getTime() - Date.now()) / 1000),
    });
    response.cookies.set('refresh_sig', refreshRaw, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: Math.floor((expiresAt.getTime() - Date.now()) / 1000),
    });
    // Expose CSRF token in a readable cookie for client-side fetches
    response.cookies.set('csrf_token', csrf, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: Math.floor((expiresAt.getTime() - Date.now()) / 1000),
    });
    // Optionally set the access token cookie as well for browser-based auth
    response.cookies.set('sos_auth', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 15, // 15 minutes
    });
    return response;

  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
