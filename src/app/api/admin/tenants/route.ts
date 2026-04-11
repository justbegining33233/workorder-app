import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const auth = requireRole(request, ['admin', 'superadmin']);
  if (auth instanceof NextResponse) return auth;

  try {
    const shops = await prisma.shop.findMany({
      select: {
        id: true,
        shopName: true,
        ownerName: true,
        status: true,
        createdAt: true,
        shopType: true,
        profileComplete: true,
        _count: {
          select: { workOrders: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch aggregated revenue per shop (sum of amountPaid on closed work orders)
    const revenueData = await prisma.workOrder.groupBy({
      by: ['shopId'],
      where: { status: 'closed', paymentStatus: 'paid' },
      _sum: { amountPaid: true },
    });

    const revenueMap = new Map<string, number>(
      revenueData.map((r) => [r.shopId, r._sum.amountPaid ?? 0])
    );

    const tenants = shops.map((shop) => ({
      id: shop.id,
      name: shop.shopName,
      ownerName: shop.ownerName || null,
      status: shop.status,
      workOrders: shop._count.workOrders,
      revenue: revenueMap.get(shop.id) ?? 0,
      shopType: shop.shopType || null,
      profileComplete: shop.profileComplete,
      createdAt: shop.createdAt.toISOString(),
    }));

    return NextResponse.json(tenants);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch tenants' }, { status: 500 });
  }
}
