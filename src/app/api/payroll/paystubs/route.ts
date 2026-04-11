import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';

// GET /api/payroll/paystubs?techId=&payPeriodId=&status=
export async function GET(req: NextRequest) {
  const auth = authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = auth.role === 'shop' ? auth.id : (auth as any).shopId;
  if (!shopId) return NextResponse.json({ error: 'No shop context' }, { status: 400 });

  const { searchParams } = new URL(req.url);
  const techId = searchParams.get('techId');
  const payPeriodId = searchParams.get('payPeriodId');
  const status = searchParams.get('status');

  const stubs = await prisma.payStub.findMany({
    where: {
      shopId,
      ...(techId && { techId }),
      ...(payPeriodId && { payPeriodId }),
      ...(status && { status }),
    },
    include: {
      tech: { select: { id: true, firstName: true, lastName: true, jobTitle: true, department: true, payType: true } },
      payPeriod: { select: { id: true, startDate: true, endDate: true, payDate: true, periodType: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(stubs);
}
