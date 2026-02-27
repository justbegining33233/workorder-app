import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole, AuthUser } from '@/lib/auth';

const VALID_STATUSES = ['ordered', 'shipped', 'received', 'cancelled'];

// GET /api/shop/purchase-orders — list all orders for the shop
export async function GET(request: NextRequest) {
  const auth = requireRole(request, ['shop', 'manager']);
  if (auth instanceof NextResponse) return auth;

  const shopId = (auth as AuthUser).shopId ?? (auth as AuthUser).id;

  try {
    const orders = await prisma.purchaseOrder.findMany({
      where: { shopId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Failed to fetch purchase orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

// POST /api/shop/purchase-orders — create a new order
export async function POST(request: NextRequest) {
  const auth = requireRole(request, ['shop', 'manager']);
  if (auth instanceof NextResponse) return auth;

  const shopId = (auth as AuthUser).shopId ?? (auth as AuthUser).id;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { vendor, items, expectedDate, notes } = body;

  if (!vendor || typeof vendor !== 'string' || !vendor.trim()) {
    return NextResponse.json({ error: 'vendor is required' }, { status: 400 });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'at least one item is required' }, { status: 400 });
  }
  for (const item of items) {
    if (!item.itemName || !String(item.itemName).trim()) {
      return NextResponse.json({ error: 'each item must have an itemName' }, { status: 400 });
    }
    if ((parseInt(item.quantity) || 0) < 1) {
      return NextResponse.json({ error: `item "${item.itemName}" must have quantity >= 1` }, { status: 400 });
    }
  }

  const totalCost = items.reduce(
    (sum: number, item: any) => sum + (parseFloat(item.unitCost) || 0) * (parseInt(item.quantity) || 0),
    0
  );

  try {
    const order = await prisma.purchaseOrder.create({
      data: {
        shopId,
        vendor: vendor.trim(),
        status: 'ordered',
        expectedDate: expectedDate ? new Date(expectedDate) : null,
        notes: notes?.trim() ?? null,
        totalCost,
        items: {
          create: items.map((item: any) => ({
            itemName: String(item.itemName).trim(),
            sku: item.sku?.trim() ?? null,
            quantity: parseInt(item.quantity) || 1,
            unitCost: parseFloat(item.unitCost) || 0,
            status: 'ordered',
          })),
        },
      },
      include: { items: true },
    });
    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    console.error('Failed to create purchase order:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
