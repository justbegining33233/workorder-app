import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const inspection = await prisma.dVIInspection.findUnique({
    where: { approvalToken: token },
    include: { items: true },
  });
  if (!inspection) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(inspection);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const body = await req.json();

  if (body._action === 'approve' || body.action === 'approve') {
    const updated = await prisma.dVIInspection.update({
      where: { approvalToken: token },
      data: { customerApproved: true, approvedAt: new Date(), status: 'approved' },
      include: { items: true },
    });
    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
