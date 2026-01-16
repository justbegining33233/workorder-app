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
    const rateLimitKey = `shop_login:${clientIP}:${username}`;
    const rateLimit = checkRateLimit(rateLimitKey);
    
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: rateLimit.message, retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000) },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rateLimit.resetTime - Date.now()) / 1000)) } }
      );
    }

    // Find shop by username, email, or shop name
    const shop = await prisma.shop.findFirst({
      where: {
        AND: [
          {
            OR: [
              { username: username },
              { email: username },
              { shopName: username },
            ],
          },
          { status: 'approved' }, // Only approved shops can login
        ],
      },
    });

    if (!shop) {
      console.log('🔴 [SHOP LOGIN] No approved shop found for username:', username);
      return NextResponse.json({ error: 'Invalid credentials or shop not approved' }, { status: 401 });
    }

    console.log('🟢 [SHOP LOGIN] Shop found:', {
      id: shop.id,
      shopName: shop.shopName,
      email: shop.email,
      username: shop.username,
      status: shop.status,
      hasPassword: !!shop.password,
      passwordLength: shop.password?.length || 0,
    });

    // Check if password exists
    if (!shop.password) {
      console.log('🔴 [SHOP LOGIN] Shop has no password!');
      return NextResponse.json({ error: 'Account setup incomplete. Please contact support.' }, { status: 401 });
    }

    // Verify password (support hashed passwords)
    console.log('🔐 [SHOP LOGIN] Comparing passwords...');
    const isValid = await bcrypt.compare(password, shop.password).catch((err) => {
      console.error('🔴 [SHOP LOGIN] Bcrypt error:', err);
      return false;
    });
    
    console.log('🔐 [SHOP LOGIN] Password valid:', isValid);
    
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Successful login - reset rate limit
    resetRateLimit(rateLimitKey);

    // Issue tokens
    const accessToken = generateAccessToken({ id: shop.id, username: shop.username, role: 'shop' });
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
        metadata: JSON.stringify({ shopId: shop.id, ip: userIp, agent: userAgent, csrfToken: csrf }),
        expiresAt,
      }
    });

    const cookieValue = `${refresh.id}:${refreshRaw}`;
    const response = NextResponse.json({
      id: shop.id,
      username: shop.username,
      shopName: shop.shopName,
      email: shop.email,
      phone: shop.phone,
      profileComplete: shop.profileComplete,
      status: shop.status,
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
    console.error('Shop login error:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
