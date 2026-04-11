import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';

// GET /api/payroll/pay-periods
export async function GET(req: NextRequest) {
  const auth = authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = auth.role === 'shop' ? auth.id : (auth as any).shopId;
  if (!shopId) return NextResponse.json({ error: 'No shop context' }, { status: 400 });

  const periods = await prisma.payPeriod.findMany({
    where: { shopId },
    include: {
      payStubs: {
        select: { id: true, techId: true, grossPay: true, netPay: true, status: true },
      },
    },
    orderBy: { startDate: 'desc' },
    take: 24,
  });

  return NextResponse.json(periods);
}

// POST /api/payroll/pay-periods - create a new pay period
export async function POST(req: NextRequest) {
  const auth = authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = auth.role === 'shop' ? auth.id : (auth as any).shopId;
  if (!shopId) return NextResponse.json({ error: 'No shop context' }, { status: 400 });
  if (auth.role !== 'shop') return NextResponse.json({ error: 'Shop owner only' }, { status: 403 });

  const body = await req.json();
  const { startDate, endDate, payDate, periodType } = body;

  if (!startDate || !endDate) {
    return NextResponse.json({ error: 'startDate and endDate required' }, { status: 400 });
  }

  const period = await prisma.payPeriod.create({
    data: {
      shopId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      payDate: payDate ? new Date(payDate) : null,
      periodType: periodType || 'biweekly',
    },
  });

  return NextResponse.json(period, { status: 201 });
}
