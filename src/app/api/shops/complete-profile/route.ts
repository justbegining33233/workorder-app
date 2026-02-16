import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateCsrf, validatePublicCsrf } from '@/lib/csrf';

export async function POST(request: NextRequest) {
  try {
    if (!request.headers.get('authorization')) {
      // Allow public double-submit CSRF when not using auth header
      const ok = validatePublicCsrf(request) || await validateCsrf(request);
      if (!ok) return NextResponse.json({ error: 'CSRF validation failed' }, { status: 403 });
    }
    const body = await request.json();
    const {
      shopId,
      businessLicense,
      insurancePolicy,
      shopType,
      dieselServices = [],
      gasServices = [],
      smallEngineServices = [],
      heavyEquipmentServices = [],
      resurfacingServices = [],
      weldingServices = [],
      tireServices = [],
    } = body;

    console.log('Complete profile request:', { shopId, businessLicense, insurancePolicy, shopType });

    if (!shopId) {
      return NextResponse.json({ error: 'Shop ID is required' }, { status: 400 });
    }

    if (!businessLicense || !insurancePolicy) {
      return NextResponse.json({ error: 'Business license and insurance policy are required' }, { status: 400 });
    }

    // Validate that services are selected based on shop type
    const totalSelected =
      (dieselServices?.length || 0) +
      (gasServices?.length || 0) +
      (smallEngineServices?.length || 0) +
      (heavyEquipmentServices?.length || 0) +
      (resurfacingServices?.length || 0) +
      (weldingServices?.length || 0) +
      (tireServices?.length || 0);

    if (!totalSelected) {
      return NextResponse.json({ error: 'Please select at least one service' }, { status: 400 });
    }

    const selectedByType: Record<string, number> = {
      diesel: dieselServices?.length || 0,
      gas: gasServices?.length || 0,
      'small-engine': smallEngineServices?.length || 0,
      'heavy-equipment': heavyEquipmentServices?.length || 0,
      resurfacing: resurfacingServices?.length || 0,
      welding: weldingServices?.length || 0,
      tire: tireServices?.length || 0,
      mixed: totalSelected,
    };

    if (!selectedByType[shopType]) {
      return NextResponse.json({ error: 'Please select at least one service that matches your shop type' }, { status: 400 });
    }

    // First check if shop exists
    const existingShop = await prisma.shop.findUnique({
      where: { id: shopId }
    });

    console.log('Shop found in database:', existingShop ? 'YES' : 'NO');

    if (!existingShop) {
      return NextResponse.json({ 
        error: 'Shop not found in database. Please contact support or re-register.', 
        details: 'The shop record does not exist. This may happen if registration was not completed properly.'
      }, { status: 404 });
    }

    // Update the shop in the database
    const updatedShop = await prisma.shop.update({
      where: { id: shopId },
      data: {
        businessLicense,
        insurancePolicy,
        shopType,
        profileComplete: true,
      },
    });

    // Store services in the database
    const allServices = [
      ...(dieselServices || []).map((serviceName: string) => ({ shopId, serviceName, category: 'diesel' })),
      ...(gasServices || []).map((serviceName: string) => ({ shopId, serviceName, category: 'gas' })),
      ...(smallEngineServices || []).map((serviceName: string) => ({ shopId, serviceName, category: 'small-engine' })),
      ...(heavyEquipmentServices || []).map((serviceName: string) => ({ shopId, serviceName, category: 'heavy-equipment' })),
      ...(resurfacingServices || []).map((serviceName: string) => ({ shopId, serviceName, category: 'resurfacing' })),
      ...(weldingServices || []).map((serviceName: string) => ({ shopId, serviceName, category: 'welding' })),
      ...(tireServices || []).map((serviceName: string) => ({ shopId, serviceName, category: 'tire' })),
    ];

    // Delete existing services first
    try {
      await prisma.shopService.deleteMany({
        where: { shopId },
      });
      console.log('Deleted existing services for shop:', shopId);
    } catch (deleteError) {
      console.error('Error deleting existing services:', deleteError);
    }

    // Create new services one by one to avoid duplicates
    if (allServices.length > 0) {
      try {
        for (const service of allServices) {
          await prisma.shopService.upsert({
            where: {
              shopId_serviceName_category: {
                shopId: service.shopId,
                serviceName: service.serviceName,
                category: service.category,
              },
            },
            update: {
              category: service.category,
            },
            create: service,
          });
        }
        console.log('Created services:', allServices.length);
      } catch (serviceError) {
        console.error('Error creating services:', serviceError);
        throw serviceError;
      }
    }

    console.log('Shop profile completed:', {
      shopId,
      dieselCount: dieselServices?.length || 0,
      gasCount: gasServices?.length || 0,
      smallEngineCount: smallEngineServices?.length || 0,
      heavyEquipmentCount: heavyEquipmentServices?.length || 0,
      resurfacingCount: resurfacingServices?.length || 0,
      weldingCount: weldingServices?.length || 0,
      tireCount: tireServices?.length || 0,
    });

    return NextResponse.json({ 
      message: 'Shop profile completed successfully',
      profile: {
        shopId,
        businessLicense,
        insurancePolicy,
        shopType,
        dieselServices: dieselServices || [],
        gasServices: gasServices || [],
        smallEngineServices: smallEngineServices || [],
        heavyEquipmentServices: heavyEquipmentServices || [],
        resurfacingServices: resurfacingServices || [],
        weldingServices: weldingServices || [],
        tireServices: tireServices || [],
        profileComplete: true,
        completedAt: updatedShop.updatedAt,
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Error completing shop profile:', error);
    return NextResponse.json({ error: 'Failed to complete shop profile' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shopId');

    if (!shopId) {
      return NextResponse.json({ error: 'Shop ID is required' }, { status: 400 });
    }

    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      include: {
        services: true,
      },
    });

    if (!shop || !shop.profileComplete) {
      return NextResponse.json({ 
        profileComplete: false,
        message: 'Profile not found' 
      }, { status: 404 });
    }

    // Group services by category
    const dieselServices = shop.services.filter(s => s.category === 'diesel').map(s => s.serviceName);
    const gasServices = shop.services.filter(s => s.category === 'gas').map(s => s.serviceName);
    const smallEngineServices = shop.services.filter(s => s.category === 'small-engine').map(s => s.serviceName);
    const heavyEquipmentServices = shop.services.filter(s => s.category === 'heavy-equipment').map(s => s.serviceName);
    const resurfacingServices = shop.services.filter(s => s.category === 'resurfacing').map(s => s.serviceName);
    const weldingServices = shop.services.filter(s => s.category === 'welding').map(s => s.serviceName);
    const tireServices = shop.services.filter(s => s.category === 'tire').map(s => s.serviceName);

    const profile = {
      shopId: shop.id,
      businessLicense: shop.businessLicense,
      insurancePolicy: shop.insurancePolicy,
      shopType: shop.shopType,
      dieselServices,
      gasServices,
      smallEngineServices,
      heavyEquipmentServices,
      resurfacingServices,
      weldingServices,
      tireServices,
      profileComplete: shop.profileComplete,
      completedAt: shop.updatedAt,
    };

    return NextResponse.json(profile, { status: 200 });
  } catch (error) {
    console.error('Error fetching shop profile:', error);
    return NextResponse.json({ error: 'Failed to fetch shop profile' }, { status: 500 });
  }
}
