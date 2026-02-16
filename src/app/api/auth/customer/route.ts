import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { checkRateLimit, getClientIP, resetRateLimit } from '@/lib/rateLimit';
import { customerLoginSchema } from '@/lib/validation';
import { sanitizeObject } from '@/lib/sanitize';

// @ts-ignore
import { generateAccessToken, generateRandomToken, refreshExpiryDate } from '@/lib/auth';

// POST /api/auth/customer
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const sanitizedBody = sanitizeObject(body);

    // Validate input
    const validationResult = customerLoginSchema.safeParse(sanitizedBody);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { email, password } = validationResult.data;

    // Rate limiting - prevent brute force attacks
    const clientIP = getClientIP(request);
    const rateLimitKey = `customer_login:${clientIP}:${email}`;
    const rateLimit = checkRateLimit(rateLimitKey);
    
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: rateLimit.message, retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000) },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rateLimit.resetTime - Date.now()) / 1000)) } }
      );
    }

    // Lazy-load runtime-sensitive modules to avoid build-time import failures
    const prisma = (await import('@/lib/prisma')).default;
    const bcryptMod = await import('bcrypt');
    const bcrypt = (bcryptMod && (bcryptMod.default ?? bcryptMod)) as typeof import('bcrypt');

    // Find customer by email OR username
    const customer = await prisma.customer.findFirst({
      where: {
        OR: [
          { email: email },
          { username: email } // Allow login with username too
        ]
      },
    });
    if (!customer) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Verify hashed password
    const isValid = await bcrypt.compare(password, customer.password).catch(() => false);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Successful login - reset rate limit
    resetRateLimit(rateLimitKey);

    const accessToken = generateAccessToken({ id: customer.id, username: customer.email, role: 'customer' });
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
        metadata: JSON.stringify({ customerId: customer.id, ip: userIp, agent: userAgent, csrfToken: csrf }),
        expiresAt,
      }
    });

    const cookieValue = `${refresh.id}:${refreshRaw}`;
    const response = NextResponse.json({
      id: customer.id,
      username: customer.email,
      fullName: `${customer.firstName} ${customer.lastName}`,
      email: customer.email,
      role: 'customer',
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
    console.error('Customer login error:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
