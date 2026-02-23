/**
 * GET /api/customers/recurring-approvals
 *
 * Returns work orders with status 'awaiting-confirmation' for the logged-in customer.
 * These are recurring services that need customer approval before a bay is reserved.
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  if (auth.role !== 'customer') {
    return NextResponse.json({ error: 'Customers only' }, { status: 403 });
  }

  const pending = await prisma.workOrder.findMany({
    where: {
      customerId: auth.id,
      status: 'awaiting-confirmation',
    },
    include: {
      shop: { select: { shopName: true, address: true, phone: true } },
      vehicle: { select: { make: true, model: true, year: true, licensePlate: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const approvals = pending.map((wo) => ({
    id: wo.id,
    service: wo.issueDescription,
    shopName: wo.shop?.shopName ?? 'Your Shop',
    shopAddress: wo.shop?.address ?? '',
    shopPhone: wo.shop?.phone ?? '',
    vehicle: wo.vehicle
      ? `${wo.vehicle.year} ${wo.vehicle.make} ${wo.vehicle.model}`
      : wo.vehicleType,
    estimatedCost: wo.estimatedCost,
    serviceLocation: wo.serviceLocation,
    createdAt: wo.createdAt.toISOString(),
  }));

  return NextResponse.json({ success: true, approvals });
}
