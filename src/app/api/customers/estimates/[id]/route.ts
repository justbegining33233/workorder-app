import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'customer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { action } = await request.json();

    if (!action || !['accept', 'deny'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Find the estimate/work order
    const estimate = await prisma.workOrder.findUnique({
      where: { id: id },
      include: {
        customer: true,
        shop: true,
      },
    });

    if (!estimate) {
      return NextResponse.json({ error: 'Estimate not found' }, { status: 404 });
    }

    // Verify the estimate belongs to the authenticated customer
    if (estimate.customerId !== decoded.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check if estimate is in pending status
    if (estimate.status !== 'pending') {
      return NextResponse.json({ error: 'Estimate is not pending' }, { status: 400 });
    }

    // Update the status based on action
    const newStatus = action === 'accept' ? 'accepted' : 'denied';

    const updatedEstimate = await prisma.workOrder.update({
      where: { id: id },
      data: { status: newStatus },
      include: {
        customer: true,
        shop: true,
      },
    });

    return NextResponse.json({
      success: true,
      estimate: {
        id: updatedEstimate.id,
        status: updatedEstimate.status,
        createdAt: updatedEstimate.createdAt,
        updatedAt: updatedEstimate.updatedAt,
        customer: {
          id: updatedEstimate.customer.id,
          name: `${updatedEstimate.customer.firstName} ${updatedEstimate.customer.lastName}`,
          email: updatedEstimate.customer.email,
        },
        shop: {
          id: updatedEstimate.shop.id,
          name: updatedEstimate.shop.shopName,
          address: updatedEstimate.shop.address,
        },
      },
    });

  } catch (error) {
    console.error('Error updating estimate:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}