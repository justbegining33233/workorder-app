import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  if (auth.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized — admin only' }, { status: 403 });
  }

  try {
    const customerCount = await prisma.customer.count();
    const shopCount = await prisma.shop.count();
    const techCount = await prisma.tech.count();
    const adminCount = await prisma.admin.count();
    const workOrderCounts = await prisma.workOrder.groupBy({
      by: ['status'],
      _count: { id: true },
    });
    return NextResponse.json({
      userCounts: {
        customers: customerCount,
        shops: shopCount,
        techs: techCount,
        admins: adminCount,
      },
      workOrderCounts,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Admin/Usage] DB error:', msg);
    return NextResponse.json({ error: 'Failed to fetch usage stats' }, { status: 500 });
  }
}
