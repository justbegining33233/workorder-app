import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';

// PUT /api/payroll/schedule/[id] - update shift
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = auth.role === 'shop' ? auth.id : (auth as any).shopId;
  if (!shopId) return NextResponse.json({ error: 'No shop context' }, { status: 400 });

  const { id } = await params;
  const body = await req.json();

  const shift = await prisma.shift.update({
    where: { id, shopId },
    data: {
      ...(body.startTime && { startTime: body.startTime }),
      ...(body.endTime && { endTime: body.endTime }),
      ...(body.shiftType && { shiftType: body.shiftType }),
      ...(body.position !== undefined && { position: body.position }),
      ...(body.notes !== undefined && { notes: body.notes }),
      ...(body.status && { status: body.status }),
      ...(body.actualClockIn && { actualClockIn: new Date(body.actualClockIn) }),
      ...(body.actualClockOut && { actualClockOut: new Date(body.actualClockOut) }),
      ...(body.lateMinutes !== undefined && { lateMinutes: body.lateMinutes }),
    },
    include: {
      tech: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  return NextResponse.json(shift);
}

// DELETE /api/payroll/schedule/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = auth.role === 'shop' ? auth.id : (auth as any).shopId;
  if (!shopId) return NextResponse.json({ error: 'No shop context' }, { status: 400 });

  const { id } = await params;
  await prisma.shift.delete({ where: { id, shopId } });
  return NextResponse.json({ ok: true });
}
