import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/middleware';
import { validateCsrf } from '@/lib/csrf';

export async function POST(request: NextRequest) {
  const auth = requireRole(request, ['shop', 'manager']);
  if (auth instanceof NextResponse) return auth;
  
  try {
    if (!request.headers.get('authorization')) {
      const ok = await validateCsrf(request);
      if (!ok) return NextResponse.json({ error: 'CSRF validation failed' }, { status: 403 });
    }
    const { workOrderId, techId } = await request.json();
    
    // Get work order
    const workOrder = await prisma.workOrder.findUnique({
      where: { id: workOrderId },
      include: { customer: true },
    });
    
    if (!workOrder) {
      return NextResponse.json({ error: 'Work order not found' }, { status: 404 });
    }
    
    // Check shop ownership
    const shopId = auth.role === 'shop' ? auth.id : auth.shopId;
    if (workOrder.shopId !== shopId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    // Verify tech belongs to shop
    const tech = await prisma.tech.findFirst({
      where: {
        id: techId,
        shopId: shopId!,
      },
    });
    
    if (!tech) {
      return NextResponse.json({ error: 'Tech not found or not in your shop' }, { status: 404 });
    }
    
    // Update work order
    const updated = await prisma.workOrder.update({
      where: { id: workOrderId },
      data: {
        assignedToId: techId,
        status: workOrder.status === 'pending' ? 'assigned' : workOrder.status,
      },
      include: {
        assignedTo: true,
      },
    });
    
    // Create status history
    if (workOrder.status === 'pending') {
      await prisma.statusHistory.create({
        data: {
          workOrderId,
          fromStatus: 'pending',
          toStatus: 'assigned',
          changedById: auth.id,
          reason: `Assigned to ${tech.firstName} ${tech.lastName}`,
        },
      });
    }
    
    // Create notification
    await prisma.notification.create({
      data: {
        customerId: workOrder.customerId,
        type: 'assignment',
        title: 'Technician Assigned',
        message: `${tech.firstName} ${tech.lastName} has been assigned to your work order`,
        workOrderId,
      },
    });
    
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error assigning tech:', error);
    return NextResponse.json({ error: 'Failed to assign tech' }, { status: 500 });
  }
}
