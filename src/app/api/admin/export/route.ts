import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  // Require admin authentication
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  if (auth.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized - Admin access only' }, { status: 403 });
  }

  // Export all work orders as CSV
  const workOrders = await prisma.workOrder.findMany();
  const csv = [
    'ID,CustomerID,ShopID,Status,VehicleType,ServiceLocation,CreatedAt',
    ...workOrders.map(w => `${w.id},${w.customerId},${w.shopId},${w.status},${w.vehicleType},${w.serviceLocation},${w.createdAt}`)
  ].join('\n');
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="workorders.csv"',
    },
  });
}
