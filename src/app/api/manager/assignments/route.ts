import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// POST - Assign work order to tech
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || (decoded.role !== 'manager' && decoded.role !== 'shop')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { workOrderId, techId } = body;

    if (!workOrderId || !techId) {
      return NextResponse.json(
        { error: 'Work order ID and tech ID are required' },
        { status: 400 }
      );
    }

    // Verify work order exists and belongs to manager's shop
    const workOrder = await prisma.workOrder.findUnique({
      where: { id: workOrderId },
    });

    if (!workOrder) {
      return NextResponse.json({ error: 'Work order not found' }, { status: 404 });
    }

    if (workOrder.shopId !== decoded.shopId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify tech exists and belongs to shop
    const tech = await prisma.tech.findUnique({
      where: { id: techId },
      select: { id: true, shopId: true, firstName: true, lastName: true },
    });

    if (!tech || tech.shopId !== decoded.shopId) {
      return NextResponse.json({ error: 'Tech not found or not in your shop' }, { status: 404 });
    }

    // Update work order
    const updatedWorkOrder = await prisma.workOrder.update({
      where: { id: workOrderId },
      data: {
        assignedTechId: techId,
        status: workOrder.status === 'pending' ? 'assigned' : workOrder.status,
      },
      include: {
        assignedTo: {
          select: { id: true, firstName: true, lastName: true },
        },
        customer: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    // Create status history entry
    await prisma.statusHistory.create({
      data: {
        workOrderId,
        fromStatus: workOrder.status,
        toStatus: updatedWorkOrder.status,
        reason: `Assigned to ${tech.firstName} ${tech.lastName}`,
        changedById: techId,
      },
    });

    return NextResponse.json({ workOrder: updatedWorkOrder });
  } catch (error) {
    console.error('Error assigning work order:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
