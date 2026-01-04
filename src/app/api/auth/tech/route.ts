import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { checkRateLimit, getClientIP, resetRateLimit } from '@/lib/rateLimit';

// @ts-ignore
import { generateAccessToken, generateRandomToken, refreshExpiryDate } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password required' }, { status: 400 });
    }

    // Rate limiting - prevent brute force attacks
    const clientIP = getClientIP(request);
    const rateLimitKey = `tech_login:${clientIP}:${username}`;
    const rateLimit = checkRateLimit(rateLimitKey);
    
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: rateLimit.message, retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000) },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rateLimit.resetTime - Date.now()) / 1000)) } }
      );
    }

    // Find tech by email or phone
    const tech = await prisma.tech.findFirst({
      where: {
        OR: [
          { email: username },
          { phone: username },
        ],
      },
      include: {
        shop: {
          select: {
            id: true,
            shopName: true,
          },
        },
      },
    });

    if (!tech) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, tech.password);
    
    if (!isValidPassword) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Successful login - reset rate limit
    resetRateLimit(rateLimitKey);

    // Issue tokens
    const accessToken = generateAccessToken({ id: tech.id, email: tech.email, role: tech.role, shopId: tech.shopId });

    const refreshRaw = generateRandomToken(48);
    const refreshHash = await bcrypt.hash(refreshRaw, 12);
    const expiresAt = refreshExpiryDate();
    const userIp = request.headers.get('x-forwarded-for') || request.headers.get('host') || '';
    const userAgent = request.headers.get('user-agent') || '';
    const csrf = (await import('@/lib/csrf')).generateCsrfToken();
    const refresh = await (prisma as any).refreshToken.create({
      data: {
        tokenHash: refreshHash,
        adminId: null,
        // associate tech sessions via metadata for now
        metadata: { techId: tech.id, ip: userIp, agent: userAgent, csrfToken: csrf },
        expiresAt,
      }
    });

    const cookieValue = `${refresh.id}:${refreshRaw}`;

    const response = NextResponse.json({
      id: tech.id,
      email: tech.email,
      firstName: tech.firstName,
      lastName: tech.lastName,
      name: `${tech.firstName} ${tech.lastName}`,
      phone: tech.phone,
      role: tech.role,
      shopId: tech.shopId,
      shopName: tech.shop.shopName,
      accessToken,
    }, { status: 200 });

    response.cookies.set('refresh_id', refresh.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: Math.floor((expiresAt.getTime() - Date.now()) / 1000),
    });
    response.cookies.set('refresh_sig', refreshRaw, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: Math.floor((expiresAt.getTime() - Date.now()) / 1000),
    });
    response.cookies.set('csrf_token', csrf, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: Math.floor((expiresAt.getTime() - Date.now()) / 1000),
    });
    response.cookies.set('sos_auth', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 15,
    });
    return response;
  } catch (error) {
    console.error('Tech login error:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
