import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyPassword, generateToken, generateRandomToken, refreshExpiryDate } from '@/lib/auth';
import bcrypt from 'bcrypt';
import { requireAuth } from '@/lib/middleware';
import { validateCsrf } from '@/lib/csrf';

// Get approved shops
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const zipCode = searchParams.get('zipCode');
    
    const where: any = { status: 'approved' };
    
    if (zipCode) {
      where.zipCode = { contains: zipCode };
    }
    
    const shops = await prisma.shop.findMany({
      where,
      select: {
        id: true,
        shopName: true,
        email: true,
        phone: true,
        zipCode: true,
        address: true,
        city: true,
        state: true,
        profileComplete: true,
        businessLicense: true,
        insurancePolicy: true,
        shopType: true,
        createdAt: true,
        services: {
          select: {
            serviceName: true,
            category: true,
            price: true,
          },
        },
      },
      orderBy: { shopName: 'asc' },
    });
    
    return NextResponse.json(shops);
  } catch (error) {
    console.error('Error fetching shops:', error);
    return NextResponse.json({ error: 'Failed to fetch shops' }, { status: 500 });
  }
}

// Shop login
export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();
    
    const shop = await prisma.shop.findFirst({
      where: {
        username,
        status: 'approved',
      },
    });
    
    if (!shop) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    
    const valid = await verifyPassword(password, shop.password);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    
    // Create tokens and set cookies for cookie-based auth
    const accessToken = generateToken({ id: shop.id, email: shop.email, role: 'shop', shopId: shop.id });
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
        metadata: { shopId: shop.id, ip: userIp, agent: userAgent, csrfToken: csrf },
        expiresAt,
      }
    });

    const response = NextResponse.json({
      token: accessToken,
      shop: {
        id: shop.id,
        shopName: shop.shopName,
        email: shop.email,
        profileComplete: shop.profileComplete,
      },
    });

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

// Update shop
export async function PATCH(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  try {
    if (!request.headers.get('authorization')) {
      const ok = await validateCsrf(request);
      if (!ok) return NextResponse.json({ error: 'CSRF validation failed' }, { status: 403 });
    }
    if (auth.role !== 'admin') return NextResponse.json({ error: 'Admin role required' }, { status: 403 });
    const { id, profileComplete } = await request.json();
    
    const shop = await prisma.shop.update({
      where: { id },
      data: { profileComplete },
    });
    
    return NextResponse.json(shop);
  } catch (error) {
    console.error('Error updating shop:', error);
    return NextResponse.json({ error: 'Failed to update shop' }, { status: 500 });
  }
}
