import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const auth = authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = auth.role === 'shop' ? auth.id : (auth as any).shopId;
  if (!shopId) return NextResponse.json({ error: 'No shop context' }, { status: 400 });

  try {
    const items = await prisma.coreReturn.findMany({ where: { shopId }, orderBy: { createdAt: 'desc' } });
    return NextResponse.json(items);
  } catch (err) {
    console.error('core-returns GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = auth.role === 'shop' ? auth.id : (auth as any).shopId;
  if (!shopId) return NextResponse.json({ error: 'No shop context' }, { status: 400 });

  try {
    const body = await req.json();
    const item = await prisma.coreReturn.create({
      data: {
        shopId,
        partName: body.partName,
        partNumber: body.partNumber,
        vendor: body.vendor,
        coreValue: Number(body.coreValue) || 0,
        workOrderId: body.workOrderId || null,
        status: 'pending',
        notes: body.notes,
      },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (err) {
    console.error('core-returns POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
