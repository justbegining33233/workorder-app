import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!['shop', 'manager', 'admin', 'superadmin'].includes(auth.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json();
  // Allowlist mutable fields — prevent shopId/id overwrite
  const { name, feeAmount, unit, taxable, active } = body;
  const fee = await prisma.environmentalFee.update({
    where: { id },
    data: { name, feeAmount, unit, taxable, active },
  });
  return NextResponse.json(fee);
}
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  await prisma.environmentalFee.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
