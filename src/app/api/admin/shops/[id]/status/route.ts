import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/middleware';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  if (auth.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const { status } = await request.json();

    // Validate status
    const validStatuses = ['pending', 'approved', 'suspended'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: pending, approved, suspended' },
        { status: 400 }
      );
    }

    // Check if shop exists
    const existingShop = await prisma.shop.findUnique({
      where: { id }
    });

    if (!existingShop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    // Update shop status
    const updatedShop = await prisma.shop.update({
      where: { id },
      data: {
        status,
        ...(status === 'approved' && !existingShop.approvedAt ? { approvedAt: new Date() } : {})
      }
    });

    return NextResponse.json({
      message: `Shop status updated to ${status}`,
      shop: {
        id: updatedShop.id,
        shopName: updatedShop.shopName,
        status: updatedShop.status
      }
    });
  } catch (error) {
    console.error('Error updating shop status:', error);
    return NextResponse.json(
      { error: 'Failed to update shop status' },
      { status: 500 }
    );
  }
}
