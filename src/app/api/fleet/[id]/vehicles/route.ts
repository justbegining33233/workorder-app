import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';

// POST /api/fleet/[id]/vehicles
// Adds a vehicle to the specified fleet account.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: fleetAccountId } = await params;
  const body = await req.json();
  const { make, model, year, vin, licensePlate, unitNumber } = body;

  if (!make || !model || !year) {
    return NextResponse.json(
      { error: 'make, model and year are required' },
      { status: 400 }
    );
  }

  const vehicle = await prisma.fleetVehicle.create({
    data: {
      fleetAccountId,
      make,
      model,
      year: Number(year),
      vin: vin || null,
      licensePlate: licensePlate || null,
      unitNumber: unitNumber || null,
    },
  });

  return NextResponse.json(vehicle, { status: 201 });
}

// GET /api/fleet/[id]/vehicles
// Returns all vehicles belonging to the specified fleet account.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: fleetAccountId } = await params;

  const vehicles = await prisma.fleetVehicle.findMany({
    where: { fleetAccountId },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(vehicles);
}
