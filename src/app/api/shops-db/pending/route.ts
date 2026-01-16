import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { requireAuth } from '@/lib/middleware';
import { validateCsrf } from '@/lib/csrf';
import { shopRegistrationSchema } from '@/lib/validation';
import { sanitizeObject } from '@/lib/sanitize';
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit';

// Get pending shops
export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  // Apply rate limiting
  const rateLimitResult = rateLimit(rateLimitConfigs.api)(request);
  if (rateLimitResult) return rateLimitResult;

  try {
    const shops = await prisma.shop.findMany({
      where: { status: 'pending' },
      select: {
        id: true,
        username: true,
        shopName: true,
        email: true,
        phone: true,
        zipCode: true,
        address: true,
        city: true,
        state: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    
    return NextResponse.json(shops);
  } catch (error) {
    console.error('Error fetching pending shops:', error);
    return NextResponse.json({ error: 'Failed to fetch pending shops' }, { status: 500 });
  }
}

// Create shop application
export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = rateLimit(rateLimitConfigs.auth)(request);
  if (rateLimitResult) return rateLimitResult;

  try {
    const body = await request.json();
    const sanitizedBody = sanitizeObject(body);

    // Validate input
    const validationResult = shopRegistrationSchema.safeParse(sanitizedBody);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const data = validationResult.data;
    
    // Check if username/email exists
    const existing = await prisma.shop.findFirst({
      where: {
        OR: [
          { username: data.username },
          { email: data.email },
        ],
      },
    });
    
    if (existing) {
      return NextResponse.json({ error: 'Username or email already exists' }, { status: 400 });
    }
    
    // Hash password
    const hashedPassword = await hashPassword(data.password);
    
    // Create shop
    const shop = await prisma.shop.create({
      data: {
        username: data.username,
        password: hashedPassword,
        shopName: data.shopName,
        email: data.email,
        phone: data.phone,
        zipCode: data.zipCode,
        address: data.address,
        city: data.city,
        state: data.state,
        status: 'pending',
      },
      select: {
        id: true,
        username: true,
        shopName: true,
        email: true,
        status: true,
      },
    });
    
    return NextResponse.json(shop, { status: 201 });
  } catch (error) {
    console.error('Error creating shop:', error);
    return NextResponse.json({ error: 'Failed to create shop' }, { status: 500 });
  }
}

// Approve/Deny shop
export async function PATCH(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  try {
    if (!request.headers.get('authorization')) {
      const ok = await validateCsrf(request);
      if (!ok) return NextResponse.json({ error: 'CSRF validation failed' }, { status: 403 });
    }
    if (auth.role !== 'admin') return NextResponse.json({ error: 'Admin role required' }, { status: 403 });
    const { id, action } = await request.json();
    
    if (action === 'approve') {
      const shop = await prisma.shop.update({
        where: { id },
        data: {
          status: 'approved',
          approvedAt: new Date(),
        },
      });
      
      // Create activity log
      await prisma.activityLog.create({
        data: {
          type: 'shop',
          action: 'Shop approved',
          details: shop.shopName,
          location: `${shop.city}, ${shop.state}`,
          severity: 'info',
          user: 'Admin',
        },
      });
      
      return NextResponse.json(shop);
    } else if (action === 'deny') {
      await prisma.shop.delete({ where: { id } });
      return NextResponse.json({ message: 'Shop denied and removed' });
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error updating shop:', error);
    return NextResponse.json({ error: 'Failed to update shop' }, { status: 500 });
  }
}
