import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { validateCsrf } from '@/lib/csrf';

export async function GET() {
  try {
    // Return all approved shops from the database
    const approvedShops = await prisma.shop.findMany({
      where: {
        status: 'approved'
      },
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        username: true,
        password: true,
        shopName: true,
        ownerName: true,
        email: true,
        phone: true,
        zipCode: true,
        address: true,
        city: true,
        state: true,
        businessLicense: true,
        insurancePolicy: true,
        shopType: true,
        profileComplete: true,
        createdAt: true,
        workOrders: {
          select: {
            id: true,
            amountPaid: true,
            paymentStatus: true,
            status: true,
            createdAt: true
          }
        },
        services: {
          select: {
            id: true,
            serviceName: true,
            category: true,
            price: true,
            duration: true,
            description: true
          }
        }
      }
    });

    // Format response to match expected structure with real stats
    const formattedShops = await Promise.all(approvedShops.map(async (shop) => {
      const completedJobs = shop.workOrders.filter(wo => wo.status === 'closed').length;
      const totalRevenue = shop.workOrders
        .filter(wo => wo.paymentStatus === 'paid')
        .reduce((sum, wo) => sum + (wo.amountPaid || 0), 0);
      
      // Calculate average rating (placeholder for now)
      const rating = completedJobs > 0 ? 4.5 : 0;
      
      // Calculate completion rate
      const totalJobs = shop.workOrders.length;
      const completionRate = totalJobs > 0 ? Math.round((completedJobs / totalJobs) * 100) : 0;
      
      // Calculate average response time (placeholder)
      const averageResponseTime = completedJobs > 0 ? '2-4 hours' : 'N/A';

      // Separate services by category
      const dieselServices = shop.services.filter(s => s.category === 'diesel');
      const gasServices = shop.services.filter(s => s.category === 'gas');

      return {
        id: shop.id,
        name: shop.shopName,
        location: `${shop.city || ''}, ${shop.state || ''}`.trim(),
        address: shop.address,
        phone: shop.phone,
        email: shop.email,
        revenue: `$${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        jobs: completedJobs,
        rating: rating,
        status: 'verified',
        services: shop.services, // Include all services
        shopName: shop.shopName,
        ownerName: shop.ownerName || '',
        businessLicense: shop.businessLicense || '',
        insurancePolicy: shop.insurancePolicy || '',
        completionRate: completionRate,
        averageResponseTime: averageResponseTime,
        profileComplete: shop.profileComplete,
        username: shop.username,
        password: shop.password,
        zipCode: shop.zipCode,
        shopType: shop.shopType,
        joinedDate: shop.createdAt,
        dieselServices: dieselServices,
        gasServices: gasServices,
      };
    }));

    return NextResponse.json(formattedShops);
  } catch (error) {
    console.error('Error fetching approved shops:', error);
    return NextResponse.json(
      { error: 'Failed to fetch accepted shops' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // This endpoint is no longer needed since shops are created in pending
    // and moved to approved status via PATCH, but keeping for compatibility
    return NextResponse.json({ 
      message: 'Use /api/shops/pending to create shops',
    }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add shop' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const ok = await validateCsrf(request);
    if (!ok) return NextResponse.json({ error: 'CSRF validation failed' }, { status: 403 });
    const body = await request.json();
      // Return all approved shops from the database, including their services
    const { shopId, profileComplete, businessLicense, insurancePolicy, shopType, dieselServices, gasServices } = body;

    // Update shop in database
    const updatedShop = await prisma.shop.update({
      where: { id: shopId },
      data: {
        ...(profileComplete !== undefined && { profileComplete }),
        ...(businessLicense !== undefined && { businessLicense }),
        ...(insurancePolicy !== undefined && { insurancePolicy }),
        ...(shopType !== undefined && { shopType }),
      }
    });

    return NextResponse.json({ 
      message: 'Shop profile updated',
      shop: updatedShop
    }, { status: 200 });
  } catch (error) {
    console.error('Error updating shop:', error);
    return NextResponse.json({ error: 'Failed to update shop' }, { status: 500 });
  }
}
