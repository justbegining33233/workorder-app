import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/middleware';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  if (auth.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    const { id } = await params;

    const shop = await prisma.shop.findUnique({
      where: { id },
      include: {
        subscription: {
          select: {
            plan: true,
            status: true,
            currentPeriodEnd: true,
            trialEnd: true
          }
        },
        workOrders: {
          select: {
            id: true,
            status: true,
            amountPaid: true,
            paymentStatus: true
          }
        },
        techs: {
          select: { id: true }
        },
        reviews: {
          select: { rating: true }
        }
      }
    });

    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    // Calculate stats
    const totalWorkOrders = shop.workOrders.length;
    const completedWorkOrders = shop.workOrders.filter(wo => wo.status === 'closed').length;
    const totalRevenue = shop.workOrders
      .filter(wo => wo.paymentStatus === 'paid')
      .reduce((sum, wo) => sum + (wo.amountPaid || 0), 0);
    const technicians = shop.techs.length;
    
    // Get unique customers count from work orders
    const customersCount = await prisma.workOrder.findMany({
      where: { shopId: id },
      select: { customerId: true },
      distinct: ['customerId']
    });
    
    // Calculate average rating
    const avgRating = shop.reviews.length > 0
      ? shop.reviews.reduce((sum, r) => sum + r.rating, 0) / shop.reviews.length
      : 0;

    return NextResponse.json({
      id: shop.id,
      shopName: shop.shopName,
      ownerName: shop.ownerName,
      email: shop.email,
      phone: shop.phone,
      address: shop.address,
      city: shop.city,
      state: shop.state,
      zipCode: shop.zipCode,
      shopType: shop.shopType,
      status: shop.status,
      businessLicense: shop.businessLicense,
      insurancePolicy: shop.insurancePolicy,
      profileComplete: shop.profileComplete,
      createdAt: shop.createdAt,
      approvedAt: shop.approvedAt,
      subscription: shop.subscription,
      stats: {
        totalWorkOrders,
        completedWorkOrders,
        totalRevenue,
        technicians,
        customers: customersCount.length,
        avgRating
      }
    });
  } catch (error) {
    console.error('Error fetching shop details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shop details' },
      { status: 500 }
    );
  }
}
