import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const auth = authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = auth.role === 'shop' ? auth.id : (auth as any).shopId;
  if (!shopId) return NextResponse.json({ error: 'No shop context' }, { status: 400 });

  const loaners = await prisma.loanerVehicle.findMany({ where: { shopId }, orderBy: { createdAt: 'desc' } });
  return NextResponse.json(loaners);
}

export async function POST(req: NextRequest) {
  const auth = authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = auth.role === 'shop' ? auth.id : (auth as any).shopId;
  if (!shopId) return NextResponse.json({ error: 'No shop context' }, { status: 400 });

  const body = await req.json();
  const loaner = await prisma.loanerVehicle.create({
    data: {
      shopId,
      make: body.make,
      model: body.model,
      year: Number(body.year),
      color: body.color,
      licensePlate: body.licensePlate,
      vin: body.vin,
      status: 'available',
    },
  });
  return NextResponse.json(loaner, { status: 201 });
}
