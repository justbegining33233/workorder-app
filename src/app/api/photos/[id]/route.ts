import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

export const runtime = 'nodejs';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireRole(request, ['shop', 'manager', 'admin', 'tech']);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const body = await request.json();
    const photo = await prisma.photo.update({
      where: { id },
      data: {
        caption: body.caption ?? undefined,
        workOrderId: body.workOrderId ?? undefined,
      },
    });
    return NextResponse.json({ photo });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireRole(request, ['shop', 'manager', 'admin', 'tech']);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    await prisma.photo.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}
