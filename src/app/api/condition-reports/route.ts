import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const auth = authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = auth.role === 'shop' ? auth.id : (auth as any).shopId;
  if (!shopId) return NextResponse.json({ error: 'No shop' }, { status: 400 });
  const reports = await prisma.vehicleConditionReport.findMany({ where: { shopId }, orderBy: { createdAt: 'desc' } });
  return NextResponse.json(reports);
}

export async function POST(req: NextRequest) {
  const auth = authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = auth.role === 'shop' ? auth.id : (auth as any).shopId;
  if (!shopId) return NextResponse.json({ error: 'No shop' }, { status: 400 });
  const body = await req.json();
  const techId = auth.role === 'tech' ? auth.id : body.techId || null;
  const report = await prisma.vehicleConditionReport.create({
    data: {
      shopId,
      workOrderId: body.workOrderId || null,
      customerId: body.customerId || null,
      type: body.type || 'checkin',
      vehicleDesc: body.vehicleDesc,
      mileage: body.mileage ? Number(body.mileage) : null,
      fuelLevel: body.fuelLevel,
      damageNotes: body.damageNotes,
      photos: body.photos ? JSON.stringify(body.photos) : null,
      techId,
    },
  });
  return NextResponse.json(report, { status: 201 });
}
