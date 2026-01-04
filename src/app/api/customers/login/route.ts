import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyPassword, generateToken, generateRandomToken, refreshExpiryDate } from '@/lib/auth';
import bcrypt from 'bcrypt';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = loginSchema.parse(body);
    
    // Find customer
    const customer = await prisma.customer.findUnique({
      where: { email: data.email },
    });
    
    if (!customer) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    
    // Verify password
    const valid = await verifyPassword(data.password, customer.password);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    
    // Generate access and refresh tokens, store refresh token server-side and set cookies
    const accessToken = generateToken({ id: customer.id, email: customer.email, role: 'customer' });
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
        metadata: { customerId: customer.id, ip: userIp, agent: userAgent, csrfToken: csrf },
        expiresAt,
      }
    });

    const response = NextResponse.json({
      token: accessToken,
      user: {
        id: customer.id,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        role: 'customer',
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
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
