import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';

// PUT /api/payroll/leave/[id] - approve, deny, or update
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = auth.role === 'shop' ? auth.id : (auth as any).shopId;
  if (!shopId) return NextResponse.json({ error: 'No shop context' }, { status: 400 });

  const { id } = await params;
  const body = await req.json();

  const request = await prisma.leaveRequest.update({
    where: { id, shopId },
    data: {
      ...(body.status && { status: body.status }),
      ...(body.status === 'approved' && {
        approvedById: auth.id,
        approvedAt: new Date(),
      }),
      ...(body.deniedReason && { deniedReason: body.deniedReason }),
      ...(body.notes !== undefined && { notes: body.notes }),
    },
    include: {
      tech: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  return NextResponse.json(request);
}

// DELETE /api/payroll/leave/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = auth.role === 'shop' ? auth.id : (auth as any).shopId;
  if (!shopId) return NextResponse.json({ error: 'No shop context' }, { status: 400 });

  const { id } = await params;
  await prisma.leaveRequest.delete({ where: { id, shopId } });
  return NextResponse.json({ ok: true });
}
