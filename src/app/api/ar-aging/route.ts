import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const auth = authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = auth.role === 'shop' ? auth.id : (auth as any).shopId;
  if (!shopId) return NextResponse.json({ error: 'No shop' }, { status: 400 });

  const now = new Date();
  const unpaidOrders = await prisma.workOrder.findMany({
    where: {
      shopId,
      paymentStatus: { in: ['unpaid', 'pending'] },
      status: { in: ['closed', 'completed'] },
    },
    include: { customer: { select: { firstName: true, lastName: true, email: true, phone: true } } },
    orderBy: { completedAt: 'asc' },
  });

  // Bucket into aging buckets
  const buckets = { current: [] as typeof unpaidOrders, days30: [] as typeof unpaidOrders, days60: [] as typeof unpaidOrders, days90plus: [] as typeof unpaidOrders };

  for (const wo of unpaidOrders) {
    const age = wo.completedAt ? Math.floor((now.getTime() - new Date(wo.completedAt).getTime()) / (1000 * 60 * 60 * 24)) : 999;
    if (age <= 30) buckets.current.push(wo);
    else if (age <= 60) buckets.days30.push(wo);
    else if (age <= 90) buckets.days60.push(wo);
    else buckets.days90plus.push(wo);
  }

  const sum = (arr: typeof unpaidOrders) => arr.reduce((acc, wo) => acc + (wo.estimatedCost || 0), 0);
  return NextResponse.json({
    summary: {
      current: { count: buckets.current.length, total: sum(buckets.current) },
      days30: { count: buckets.days30.length, total: sum(buckets.days30) },
      days60: { count: buckets.days60.length, total: sum(buckets.days60) },
      days90plus: { count: buckets.days90plus.length, total: sum(buckets.days90plus) },
    },
    orders: unpaidOrders.map(wo => {
      const age = wo.completedAt ? Math.floor((now.getTime() - new Date(wo.completedAt).getTime()) / (1000 * 60 * 60 * 24)) : 0;
      return {
        id: wo.id, customerName: `${wo.customer.firstName} ${wo.customer.lastName}`,
        customerEmail: wo.customer.email, customerPhone: wo.customer.phone,
        amount: wo.estimatedCost || 0, paymentStatus: wo.paymentStatus,
        completedAt: wo.completedAt, ageDays: age,
        bucket: age <= 30 ? 'current' : age <= 60 ? '30-60' : age <= 90 ? '60-90' : '90+',
      };
    }),
  });
}
