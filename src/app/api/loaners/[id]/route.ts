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
  const { make, model, year, color, licensePlate, vin, mileageOut, mileageIn, fuelLevelOut, fuelLevelIn, damageNotes, photos, customerId, workOrderId, checkedOutAt, expectedBack, checkedInAt, status } = body;
  const loaner = await prisma.loanerVehicle.update({
    where: { id },
    data: { make, model, year, color, licensePlate, vin, mileageOut, mileageIn, fuelLevelOut, fuelLevelIn, damageNotes, photos, customerId, workOrderId, checkedOutAt, expectedBack, checkedInAt, status },
  });
  return NextResponse.json(loaner);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  await prisma.loanerVehicle.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
