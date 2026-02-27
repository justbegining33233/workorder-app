import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

// GET /api/shop/purchase-orders — list all orders for the shop
export async function GET(request: NextRequest) {
  const auth = requireRole(request, ['shop', 'manager']);
  if (auth instanceof NextResponse) return auth;

  const shopId = (auth as any).shopId ?? (auth as any).id;

  const orders = await prisma.purchaseOrder.findMany({
    where: { shopId },
    include: { items: true },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ orders });
}

// POST /api/shop/purchase-orders — create a new order
export async function POST(request: NextRequest) {
  const auth = requireRole(request, ['shop', 'manager']);
  if (auth instanceof NextResponse) return auth;

  const shopId = (auth as any).shopId ?? (auth as any).id;
  const body = await request.json();
  const { vendor, items, expectedDate, notes } = body;

  if (!vendor) {
    return NextResponse.json({ error: 'vendor is required' }, { status: 400 });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'at least one item is required' }, { status: 400 });
  }

  const totalCost = items.reduce(
    (sum: number, item: any) => sum + (parseFloat(item.unitCost) || 0) * (parseInt(item.quantity) || 0),
    0
  );

  const order = await prisma.purchaseOrder.create({
    data: {
      shopId,
      vendor,
      status: 'ordered',
      expectedDate: expectedDate ? new Date(expectedDate) : null,
      notes: notes ?? null,
      totalCost,
      items: {
        create: items.map((item: any) => ({
          itemName: item.itemName,
          sku: item.sku ?? null,
          quantity: parseInt(item.quantity) || 1,
          unitCost: parseFloat(item.unitCost) || 0,
          status: 'ordered',
        })),
      },
    },
    include: { items: true },
  });

  return NextResponse.json({ order }, { status: 201 });
}
