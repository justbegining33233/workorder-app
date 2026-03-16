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
  const { companyName, contactName, contactEmail, contactPhone, billingAddress, taxId, netTerms, creditLimit, notes, status } = body;
  const account = await prisma.fleetAccount.update({
    where: { id },
    data: { companyName, contactName, contactEmail, contactPhone, billingAddress, taxId, netTerms, creditLimit, notes, status },
  });
  return NextResponse.json(account);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  await prisma.fleetAccount.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

// Add vehicle to fleet
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  if (body._action === 'addVehicle') {
    const vehicle = await prisma.fleetVehicle.create({
      data: { fleetAccountId: id, make: body.make, model: body.model, year: Number(body.year), vin: body.vin, licensePlate: body.licensePlate, unitNumber: body.unitNumber },
    });
    return NextResponse.json(vehicle, { status: 201 });
  }
  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
