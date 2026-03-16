import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Public: no auth needed for waiting room display
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const shopId = searchParams.get('shopId');
  if (!shopId) return NextResponse.json({ error: 'shopId required' }, { status: 400 });

  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    select: { shopName: true, id: true },
  });
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

  const activeOrders = await prisma.workOrder.findMany({
    where: {
      shopId,
      status: { in: ['assigned', 'in-progress', 'waiting-estimate', 'waiting-for-payment'] },
    },
    include: { customer: { select: { firstName: true } } },
    orderBy: { createdAt: 'asc' },
    take: 20,
  });

  const bays = await prisma.bay.findMany({ where: { shopId } });

  return NextResponse.json({
    shopName: shop.shopName,
    orders: activeOrders.map(wo => ({
      id: wo.id,
      ticketNumber: wo.id.slice(-6).toUpperCase(),
      customerInitial: wo.customer.firstName ? wo.customer.firstName.charAt(0) + '.' : '',
      status: wo.status,
      vehicleType: wo.vehicleType,
      bay: wo.bay,
      createdAt: wo.createdAt,
    })),
    bays: bays.map(b => ({ name: b.name, status: b.status, vehicleDesc: b.vehicleDesc })),
  });
}
