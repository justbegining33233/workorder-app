import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';

// GET /api/payroll/leave?status=pending&techId=
export async function GET(req: NextRequest) {
  const auth = authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = auth.role === 'shop' ? auth.id : (auth as any).shopId;
  if (!shopId) return NextResponse.json({ error: 'No shop context' }, { status: 400 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const techId = searchParams.get('techId');

  const requests = await prisma.leaveRequest.findMany({
    where: {
      shopId,
      ...(status && { status }),
      ...(techId && { techId }),
    },
    include: {
      tech: { select: { id: true, firstName: true, lastName: true, jobTitle: true, department: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(requests);
}

// POST /api/payroll/leave - submit leave request
export async function POST(req: NextRequest) {
  const auth = authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = auth.role === 'shop' ? auth.id : (auth as any).shopId;
  if (!shopId) return NextResponse.json({ error: 'No shop context' }, { status: 400 });

  const body = await req.json();
  const { techId, leaveType, startDate, endDate, reason, totalHours } = body;

  if (!techId || !leaveType || !startDate || !endDate) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const request = await prisma.leaveRequest.create({
    data: {
      shopId,
      techId,
      leaveType,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      totalHours: totalHours ?? 0,
      reason,
    },
    include: {
      tech: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  return NextResponse.json(request, { status: 201 });
}
