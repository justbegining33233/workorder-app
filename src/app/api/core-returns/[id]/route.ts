import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = auth.role === 'shop' ? auth.id : (auth as any).shopId;
  const { id } = await params;
  try {
    const existing = await prisma.coreReturn.findFirst({ where: { id, shopId } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const body = await req.json();
    const item = await prisma.coreReturn.update({ where: { id }, data: body });
    return NextResponse.json(item);
  } catch (err) {
    console.error('core-returns PUT error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = auth.role === 'shop' ? auth.id : (auth as any).shopId;
  const { id } = await params;
  try {
    const existing = await prisma.coreReturn.findFirst({ where: { id, shopId } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await prisma.coreReturn.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('core-returns DELETE error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
