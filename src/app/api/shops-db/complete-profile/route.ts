import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/middleware';
import { validateCsrf } from '@/lib/csrf';

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  try {
    if (!request.headers.get('authorization')) {
      const ok = await validateCsrf(request);
      if (!ok) return NextResponse.json({ error: 'CSRF validation failed' }, { status: 403 });
    }
    const data = await request.json();
    
    // Update shop profile
    // Only allow admin or the shop owner to update
    if (auth.role !== 'admin' && auth.id !== data.shopId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const shop = await prisma.shop.update({
      where: { id: data.shopId },
      data: {
        businessLicense: data.businessLicense,
        insurancePolicy: data.insurancePolicy,
        shopType: data.shopType,
        profileComplete: true,
      },
    });
    
    // Delete existing services
    await prisma.shopService.deleteMany({
      where: { shopId: data.shopId },
    });
    
    // Create new services
    const services = [];
    
    if (data.dieselServices && Array.isArray(data.dieselServices)) {
      for (const serviceName of data.dieselServices) {
        services.push({
          shopId: data.shopId,
          serviceName,
          category: 'diesel',
          price: 0, // Default price, can be updated later
        });
      }
    }
    
    if (data.gasServices && Array.isArray(data.gasServices)) {
      for (const serviceName of data.gasServices) {
        services.push({
          shopId: data.shopId,
          serviceName,
          category: 'gas',
          price: 0,
        });
      }
    }
    
    if (services.length > 0) {
      await prisma.shopService.createMany({
        data: services,
      });
    }
    
    return NextResponse.json({
      success: true,
      shop,
      servicesCreated: services.length,
    });
  } catch (error) {
    console.error('Error completing profile:', error);
    return NextResponse.json({ error: 'Failed to complete profile' }, { status: 500 });
  }
}

// Get shop profile
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shopId');
    
    if (!shopId) {
      return NextResponse.json({ error: 'shopId required' }, { status: 400 });
    }
    
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      include: {
        services: true,
      },
    });
    
    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }
    
    // Format response like old API
    const dieselServices = shop.services
      .filter((s: any) => s.category === 'diesel')
      .map((s: any) => s.serviceName);
    
    const gasServices = shop.services
      .filter((s: any) => s.category === 'gas')
      .map((s: any) => s.serviceName);
    
    return NextResponse.json({
      shopId: shop.id,
      businessLicense: shop.businessLicense,
      insurancePolicy: shop.insurancePolicy,
      shopType: shop.shopType,
      dieselServices,
      gasServices,
      profileComplete: shop.profileComplete,
    });
  } catch (error) {
    console.error('Error fetching shop profile:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}
