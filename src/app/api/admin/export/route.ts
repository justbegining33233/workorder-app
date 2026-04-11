import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

export async function GET(request: NextRequest) {
  // Require admin authentication
  const auth = requireRole(request, ['admin', 'superadmin']);
  if (auth instanceof NextResponse) return auth;

  // Export all work orders as CSV
  try {
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
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Admin/Export] DB error:', msg);
    return NextResponse.json({ error: 'Failed to export work orders' }, { status: 500 });
  }
}
