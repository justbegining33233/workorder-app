import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = auth.role === 'shop' ? auth.id : (auth as any).shopId;
  const { id } = await params;

  try {
    const body = await req.json();
    const bay = await prisma.bay.update({
      where: { id },
      data: {
        workOrderId: body.workOrderId ?? null,
        techId: body.techId ?? null,
        vehicleDesc: body.vehicleDesc ?? null,
        status: body.status,
        notes: body.notes,
        startedAt: body.status === 'occupied' ? new Date() : (body.status === 'empty' ? null : undefined),
      },
    });
    return NextResponse.json(bay);
  } catch (error) {
    console.error('Error updating bay:', error);
    return NextResponse.json({ error: 'Failed to update bay' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  try {
    await prisma.bay.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error deleting bay:', error);
    return NextResponse.json({ error: 'Failed to delete bay' }, { status: 500 });
  }
}
