import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const auth = authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = auth.role === 'shop' ? auth.id : (auth as any).shopId;
  if (!shopId) return NextResponse.json({ error: 'No shop' }, { status: 400 });
  const items = await prisma.stateInspection.findMany({ where: { shopId }, orderBy: { inspectedAt: 'desc' } });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const auth = authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = auth.role === 'shop' ? auth.id : (auth as any).shopId;
  if (!shopId) return NextResponse.json({ error: 'No shop' }, { status: 400 });
  const body = await req.json();
  const item = await prisma.stateInspection.create({
    data: {
      shopId,
      vehicleDesc: body.vehicleDesc,
      vin: body.vin,
      licensePlate: body.licensePlate,
      inspectionType: body.inspectionType || 'state',
      result: body.result || 'pass',
      stickerNumber: body.stickerNumber,
      inspectorId: body.inspectorId || null,
      inspectedAt: body.inspectedAt ? new Date(body.inspectedAt) : new Date(),
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      failReason: body.failReason,
      notes: body.notes,
      workOrderId: body.workOrderId || null,
      customerId: body.customerId || null,
    },
  });
  return NextResponse.json(item, { status: 201 });
}
