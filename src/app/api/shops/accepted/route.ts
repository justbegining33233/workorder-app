import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import type { AuthUser } from '@/lib/auth';

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
      take: 3,
      include: {
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
        },
        subscription: {
          select: {
            plan: true,
            status: true,
            currentPeriodEnd: true,
            trialEnd: true,
          }
        }
      }
    });

    // Format response — only expose public-facing fields (NO password, no credentials)
    const formattedShops = approvedShops.map((shop) => {
      const completedJobs = shop.workOrders.filter(wo => wo.status === 'closed').length;
      const totalRevenue = shop.workOrders
        .filter(wo => wo.paymentStatus === 'paid')
        .reduce((sum, wo) => sum + (wo.amountPaid || 0), 0);

      const rating = completedJobs > 0 ? 4.5 : 0;
      const totalJobs = shop.workOrders.length;
      const completionRate = totalJobs > 0 ? Math.round((completedJobs / totalJobs) * 100) : 0;
      const averageResponseTime = completedJobs > 0 ? '2-4 hours' : 'N/A';

      const dieselServices = shop.services.filter(s => s.category === 'diesel');
      const gasServices = shop.services.filter(s => s.category === 'gas');

      return {
        id: shop.id,
        name: shop.shopName,
        shopName: shop.shopName,
        location: `${shop.city || ''}, ${shop.state || ''}`.trim(),
        address: shop.address,
        phone: shop.phone,
        email: shop.email,
        revenue: `$${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        jobs: completedJobs,
        rating,
        status: 'verified',
        services: shop.services,
        shopType: shop.shopType,
        completionRate,
        averageResponseTime,
        profileComplete: shop.profileComplete,
        zipCode: shop.zipCode,
        joinedDate: shop.createdAt,
        createdAt: shop.createdAt,
        dieselServices,
        gasServices,
        subscription: shop.subscription
          ? { plan: shop.subscription.plan, status: shop.subscription.status, currentPeriodEnd: shop.subscription.currentPeriodEnd, trialEnd: shop.subscription.trialEnd }
          : null,
        // NOTE: password, username, businessLicense, insurancePolicy intentionally omitted
      };
    });

    return NextResponse.json(formattedShops);
  } catch (error) {
    console.error('Error fetching approved shops:', error);
    return NextResponse.json(
      { error: 'Failed to fetch accepted shops' },
      { status: 500 }
    );
  }
}

export async function POST() {
  return NextResponse.json({ message: 'Use /api/shops/pending to create shops' }, { status: 400 });
}

export async function PATCH(request: NextRequest) {
  const auth = requireRole(request, ['shop', 'manager', 'admin']);
  if (auth instanceof NextResponse) return auth;
  const user = auth as AuthUser;

  try {
    const body = await request.json().catch(() => null);
    if (!body) return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });

    const { shopId, profileComplete, businessLicense, insurancePolicy, shopType } = body;

    if (!shopId) return NextResponse.json({ error: 'shopId required' }, { status: 400 });

    // Shop-role users may only update their own profile
    if (user.role === 'shop' && user.shopId !== shopId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updatedShop = await prisma.shop.update({
      where: { id: shopId },
      data: {
        ...(profileComplete !== undefined && { profileComplete }),
        ...(businessLicense !== undefined && { businessLicense }),
        ...(insurancePolicy !== undefined && { insurancePolicy }),
        ...(shopType !== undefined && { shopType }),
      }
    });

    return NextResponse.json({ message: 'Shop profile updated', shop: updatedShop }, { status: 200 });
  } catch (error) {
    console.error('Error updating shop:', error);
    return NextResponse.json({ error: 'Failed to update shop' }, { status: 500 });
  }
}
