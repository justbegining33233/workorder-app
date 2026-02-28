import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const inspection = await prisma.dVIInspection.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!inspection) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(inspection);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  if (body._action === 'approve') {
    const updated = await prisma.dVIInspection.update({
      where: { approvalToken: id }, // token-based approval
      data: { customerApproved: true, approvedAt: new Date(), status: 'approved' },
      include: { items: true },
    });
    return NextResponse.json(updated);
  }

  if (body._action === 'send') {
    const updated = await prisma.dVIInspection.update({ where: { id }, data: { status: 'sent' } });
    return NextResponse.json(updated);
  }

  // Update items
  if (body.items) {
    await Promise.all(body.items.map(async (item: { id?: string; condition?: string; notes?: string; approved?: boolean; photos?: string }) => {
      if (item.id) {
        await prisma.dVIItem.update({ where: { id: item.id }, data: { condition: item.condition, notes: item.notes, approved: item.approved, photos: item.photos } });
      }
    }));
    const updated = await prisma.dVIInspection.findUnique({ where: { id }, include: { items: true } });
    return NextResponse.json(updated);
  }

  const auth = authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const updated = await prisma.dVIInspection.update({ where: { id }, data: { status: body.status, notes: body.notes } });
  return NextResponse.json(updated);
}
