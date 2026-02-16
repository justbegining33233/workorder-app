import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// GET /api/purchase-orders?shopId=...
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shopId');

    if (!shopId) {
      return NextResponse.json({ error: 'Shop ID required' }, { status: 400 });
    }

    const orders = await prisma.purchaseOrder.findMany({
      where: { shopId },
      orderBy: { createdAt: 'desc' },
      include: {
        items: true,
      },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Error fetching purchase orders:', error);
    return NextResponse.json({ error: 'Failed to fetch purchase orders' }, { status: 500 });
  }
}

// POST /api/purchase-orders
// Body: { shopId, vendor?, expectedDate?, notes?, createdById?, items: [{ itemName, sku?, quantity, unitCost, workOrderId?, inventoryStockId? }] }
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || (decoded.role !== 'shop' && decoded.role !== 'manager')) {
      return NextResponse.json({ error: 'Unauthorized - shop admin or manager only' }, { status: 403 });
    }

    const body = await request.json();
    const { shopId, vendor, expectedDate, notes, createdById, items } = body;

    if (!shopId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Shop ID and at least one item are required' }, { status: 400 });
    }

    const totalCost = items.reduce((sum: number, item: any) => sum + (item.unitCost || 0) * (item.quantity || 0), 0);

    const order = await prisma.purchaseOrder.create({
      data: {
        shopId,
        vendor,
        expectedDate: expectedDate ? new Date(expectedDate) : undefined,
        notes,
        status: 'ordered',
        createdById: createdById || decoded.id,
        totalCost,
        items: {
          create: items.map((item: any) => ({
            itemName: item.itemName,
            sku: item.sku,
            quantity: item.quantity || 0,
            unitCost: item.unitCost || 0,
            workOrderId: item.workOrderId || null,
            inventoryStockId: item.inventoryStockId || null,
          })),
        },
      },
      include: { items: true },
    });

    return NextResponse.json({ order, message: 'Purchase order created' }, { status: 201 });
  } catch (error) {
    console.error('Error creating purchase order:', error);
    return NextResponse.json({ error: 'Failed to create purchase order' }, { status: 500 });
  }
}
