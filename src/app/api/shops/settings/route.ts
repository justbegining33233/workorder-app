import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/middleware';
import { validateCsrf } from '@/lib/csrf';

// GET shop settings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shopId');

    if (!shopId) {
      return NextResponse.json({ error: 'Shop ID is required' }, { status: 400 });
    }

    // Get shop details
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      include: {
        services: true, // Include related services
      },
    });

    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    return NextResponse.json({
      shop: {
        id: shop.id,
        shopName: shop.shopName,
        email: shop.email,
        phone: shop.phone,
        address: shop.address,
        city: shop.city,
        state: shop.state,
        zipCode: shop.zipCode,
        businessLicense: shop.businessLicense,
        insurancePolicy: shop.insurancePolicy,
        shopType: shop.shopType,
        services: shop.services.map(s => ({
          id: s.id,
          serviceName: s.serviceName,
          category: s.category,
          price: s.price,
        })),
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching shop settings:', error);
    return NextResponse.json({ error: 'Failed to fetch shop settings' }, { status: 500 });
  }
}

// PUT update shop settings
export async function PUT(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    // Require CSRF when using cookie-based auth
    if (!request.headers.get('authorization')) {
      const ok = await validateCsrf(request);
      if (!ok) return NextResponse.json({ error: 'CSRF validation failed' }, { status: 403 });
    }

    const body = await request.json();
    const { shopId, shopName, email, phone, address, city, state, zipCode } = body;

    if (!shopId) {
      return NextResponse.json({ error: 'Shop ID is required' }, { status: 400 });
    }

    // Only allow shop owner or admin to update
    if (auth.role !== 'admin' && auth.id !== shopId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Update shop details
    const updatedShop = await prisma.shop.update({
      where: { id: shopId },
      data: {
        shopName,
        email,
        phone,
        address,
        city,
        state,
        zipCode,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: 'Shop settings updated successfully',
      shop: updatedShop,
    }, { status: 200 });
  } catch (error) {
    console.error('Error updating shop settings:', error);
    return NextResponse.json({ error: 'Failed to update shop settings' }, { status: 500 });
  }
}
