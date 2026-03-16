import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!['shop', 'manager', 'tech', 'admin', 'superadmin'].includes(auth.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json();
  // Allowlist mutable fields — prevent shopId/id overwrite
  const { inspectionType, result, stickerNumber, inspectorId, inspectedAt, expiresAt, failReason, notes, reportUrl } = body;
  const item = await prisma.stateInspection.update({
    where: { id },
    data: { inspectionType, result, stickerNumber, inspectorId, inspectedAt, expiresAt, failReason, notes, reportUrl },
  });
  return NextResponse.json(item);
}
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  await prisma.stateInspection.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
