import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    console.log('🔵 [REGISTER] Registration request received');
    const req = request as any;
    // Validate public CSRF token (double-submit)
    const { validatePublicCsrf } = await import('@/lib/csrf');
    const ok = validatePublicCsrf(req);
    if (!ok) {
      console.log('🔴 [REGISTER] CSRF validation FAILED');
      return NextResponse.json({ error: 'CSRF validation failed' }, { status: 403 });
    }
    console.log('✅ [REGISTER] CSRF validation passed');
    
    const body = await request.json();
    console.log('🔵 [REGISTER] Shop name:', body.shopName);
    
    const schema = z.object({
      shopName: z.string().min(2),
      ownerName: z.string().optional(),
      email: z.string().email(),
      phone: z.string().optional(),
      shopType: z.string().optional(),
      serviceLocation: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zipCode: z.string().optional(),
      dieselServices: z.array(z.string()).optional(),
      gasServices: z.array(z.string()).optional(),
      mobileServiceRadius: z.number().optional(),
      emergencyService24_7: z.boolean().optional(),
      acceptedPaymentMethods: z.array(z.string()).optional(),
    });
    const data = schema.parse(body);
    console.log('✅ [REGISTER] Validation passed');

    // Generate a temporary unique username for pending shops
    const tempUsername = `pending_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    console.log('🔵 [REGISTER] Creating shop with username:', tempUsername);
    
    // Create shop in database with pending status
    const newShop = await prisma.shop.create({
      data: {
        shopName: data.shopName,
        email: data.email,
        phone: data.phone || '',
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        zipCode: data.zipCode || '',
        status: 'pending',
        profileComplete: false,
        username: tempUsername, // Temporary username until approved
        password: '', // Will be set during approval
      }
    });
    
    console.log('✅ [REGISTER] Shop created successfully! ID:', newShop.id);
    
    return NextResponse.json({ 
      success: true, 
      shopId: newShop.id,
      message: 'Shop registration submitted. Awaiting admin approval.'
    });
  } catch (error) {
    console.error('🔴 [REGISTER] ERROR:', error);
    return NextResponse.json({ error: 'Registration failed', details: error }, { status: 500 });
  }
}

export async function GET() {
  try {
    const allShops = await prisma.shop.findMany({
      where: {
        status: 'pending'
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    return NextResponse.json(allShops);
  } catch (error) {
    console.error('Error fetching shops:', error);
    return NextResponse.json({ error: 'Failed to fetch shops' }, { status: 500 });
  }
}
