import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole, AuthUser } from '@/lib/auth';

const VALID_STATUSES = ['ordered', 'shipped', 'received', 'cancelled'];

// PUT /api/shop/purchase-orders/[id] — update status or fields
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireRole(request, ['shop', 'manager']);
  if (auth instanceof NextResponse) return auth;

  const shopId = (auth as AuthUser).shopId ?? (auth as AuthUser).id;
  const { id } = await params;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { status, notes, expectedDate } = body;

  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    return NextResponse.json(
      { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
      { status: 400 }
    );
  }

  try {
    const existing = await prisma.purchaseOrder.findUnique({ where: { id } });
    if (!existing || existing.shopId !== shopId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const order = await prisma.purchaseOrder.update({
      where: { id },
      data: {
        ...(status !== undefined && { status }),
        ...(notes !== undefined && { notes: notes?.trim() ?? null }),
        ...(expectedDate !== undefined && { expectedDate: expectedDate ? new Date(expectedDate) : null }),
        // When marking received, update all items too
        ...(status === 'received' && {
          items: { updateMany: { where: { purchaseOrderId: id }, data: { status: 'received' } } },
        }),
      },
      include: { items: true },
    });

    return NextResponse.json({ order });
  } catch (error) {
    console.error('Failed to update purchase order:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}

// DELETE /api/shop/purchase-orders/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireRole(request, ['shop', 'manager']);
  if (auth instanceof NextResponse) return auth;

  const shopId = (auth as AuthUser).shopId ?? (auth as AuthUser).id;
  const { id } = await params;

  try {
    const existing = await prisma.purchaseOrder.findUnique({ where: { id } });
    if (!existing || existing.shopId !== shopId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await prisma.purchaseOrder.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete purchase order:', error);
    return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 });
  }
}
