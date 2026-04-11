import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const auth = requireRole(request, ['shop', 'manager']);
  if (auth instanceof NextResponse) return auth;

  const shopId = auth.role === 'shop' ? auth.id : auth.shopId;
  if (!shopId) {
    return NextResponse.json({ error: 'Shop ID required' }, { status: 400 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'audit' or 'activity'
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500);

    if (type === 'audit') {
      const logs = await prisma.auditLog.findMany({
        where: { shopId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
      return NextResponse.json({ logs });
    }

    // Default: activity logs
    const logs = await prisma.activityLog.findMany({
      where: { shopId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return NextResponse.json({ logs: logs.map(l => ({ ...l, time: l.createdAt })) });
  } catch (error) {
    console.error('Error fetching shop logs:', error);
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
  }
}
