import { NextRequest, NextResponse } from 'next/server';
// Lazy-load `prisma` and `bcrypt` in the handler
import { generateAccessToken, generateRandomToken, refreshExpiryDate } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    const prisma = (await import('@/lib/prisma')).default;
    const bcryptMod = await import('bcrypt');
    const bcrypt = (bcryptMod && (bcryptMod.default ?? bcryptMod)) as typeof import('bcrypt');

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password required' }, { status: 400 });
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
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (!shop.password) {
      return NextResponse.json({ error: 'Account not fully set up. Please contact support.' }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, shop.password);

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Generate access token
    const accessToken = generateAccessToken({ id: shop.id, username: shop.username, role: 'shop' });

    // Create refresh token so session cookies work correctly for CSRF-protected routes
    const refreshRaw = generateRandomToken(48);
    const refreshHash = await bcrypt.hash(refreshRaw, 12);
    const expiresAt = refreshExpiryDate();
    const userIp = request.headers.get('x-forwarded-for') || request.headers.get('host') || '';
    const userAgent = request.headers.get('user-agent') || '';
    const csrf = (await import('@/lib/csrf')).generateCsrfToken();
    const refreshRecord = await (prisma as any).refreshToken.create({
      data: {
        tokenHash: refreshHash,
        adminId: null,
        metadata: JSON.stringify({ shopId: shop.id, ip: userIp, agent: userAgent, csrfToken: csrf }),
        expiresAt,
      }
    });

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

    response.cookies.set('refresh_id', refreshRecord.id, {
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
  } catch (error: any) {
    console.error('Shop login error:', error);
    return NextResponse.json({ error: 'Login failed', details: error?.message }, { status: 500 });
  }
}
