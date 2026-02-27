import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

// PUT /api/shop/purchase-orders/[id] — update status or fields
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireRole(request, ['shop', 'manager']);
  if (auth instanceof NextResponse) return auth;

  const shopId = (auth as any).shopId ?? (auth as any).id;
  const { id } = await params;

  const existing = await prisma.purchaseOrder.findUnique({ where: { id } });
  if (!existing || existing.shopId !== shopId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await request.json();
  const { status, notes, expectedDate } = body;

  const order = await prisma.purchaseOrder.update({
    where: { id },
    data: {
      ...(status !== undefined && { status }),
      ...(notes !== undefined && { notes }),
      ...(expectedDate !== undefined && { expectedDate: expectedDate ? new Date(expectedDate) : null }),
      // When marking received, update all items too
      ...(status === 'received' && {
        items: { updateMany: { where: { purchaseOrderId: id }, data: { status: 'received' } } },
      }),
    },
    include: { items: true },
  });

  return NextResponse.json({ order });
}

// DELETE /api/shop/purchase-orders/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireRole(request, ['shop', 'manager']);
  if (auth instanceof NextResponse) return auth;

  const shopId = (auth as any).shopId ?? (auth as any).id;
  const { id } = await params;

  const existing = await prisma.purchaseOrder.findUnique({ where: { id } });
  if (!existing || existing.shopId !== shopId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await prisma.purchaseOrder.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
