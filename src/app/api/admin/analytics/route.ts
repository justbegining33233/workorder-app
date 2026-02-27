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
    const totalWorkOrders = await prisma.workOrder.count();
    const completedWorkOrders = await prisma.workOrder.count({ where: { status: 'completed' } });
    const pendingWorkOrders = await prisma.workOrder.count({ where: { status: 'pending' } });
    return NextResponse.json({
      totalWorkOrders,
      completedWorkOrders,
      pendingWorkOrders,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Admin/Analytics] DB error:', msg);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
