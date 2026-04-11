import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';

// GET /api/payroll/schedule?startDate=&endDate=&techId=
export async function GET(req: NextRequest) {
  const auth = authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = auth.role === 'shop' ? auth.id : (auth as any).shopId;
  if (!shopId) return NextResponse.json({ error: 'No shop context' }, { status: 400 });

  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const techId = searchParams.get('techId');

  const where: any = { shopId };
  if (startDate) where.date = { ...where.date, gte: new Date(startDate) };
  if (endDate) where.date = { ...where.date, lte: new Date(endDate) };
  if (techId) where.techId = techId;

  const shifts = await prisma.shift.findMany({
    where,
    include: {
      tech: { select: { id: true, firstName: true, lastName: true, role: true, jobTitle: true } },
    },
    orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
  });

  return NextResponse.json(shifts);
}

// POST /api/payroll/schedule - create a shift
export async function POST(req: NextRequest) {
  const auth = authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = auth.role === 'shop' ? auth.id : (auth as any).shopId;
  if (!shopId) return NextResponse.json({ error: 'No shop context' }, { status: 400 });
  if (auth.role !== 'shop' && auth.role !== 'manager') {
    return NextResponse.json({ error: 'Managers or shop owners only' }, { status: 403 });
  }

  const body = await req.json();
  const { techId, date, startTime, endTime, shiftType, position, notes } = body;

  if (!techId || !date || !startTime || !endTime) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Check for overlapping shifts
  const existing = await prisma.shift.findFirst({
    where: {
      shopId,
      techId,
      date: new Date(date),
      status: { not: 'cancelled' },
    },
  });
  if (existing) {
    return NextResponse.json({ error: 'Employee already has a shift on this date' }, { status: 409 });
  }

  const shift = await prisma.shift.create({
    data: {
      shopId,
      techId,
      date: new Date(date),
      startTime,
      endTime,
      shiftType: shiftType || 'regular',
      position,
      notes,
    },
    include: {
      tech: { select: { id: true, firstName: true, lastName: true, role: true } },
    },
  });

  return NextResponse.json(shift, { status: 201 });
}
