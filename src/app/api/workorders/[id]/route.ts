import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/middleware';
import { sendEstimateReadyEmail, sendJobCompletedEmail, sendStatusUpdateEmail } from '@/lib/emailService';
import { pushEstimateReady, pushJobCompleted } from '@/lib/serverPush';
import { Estimate } from '@/types/workorder';
import { validateRequest, workOrderUpdateSchema } from '@/lib/validationSchemas';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  // Only include CORS headers when a specific origin is configured; otherwise
  // omit them and let browsers enforce their default same-origin policy.
  const corsOrigin = process.env.CORS_ORIGINS;
  const corsHeaders: Record<string, string> = corsOrigin
    ? {
        'Access-Control-Allow-Origin': corsOrigin,
        'Access-Control-Allow-Methods': 'GET,PUT,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    : {};
  
  try {
    const { id } = await params;
    const workOrder = await prisma.workOrder.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        shop: {
          select: {
            id: true,
            shopName: true,
            phone: true,
            email: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    
    if (!workOrder) {
      return NextResponse.json({ error: 'Work order not found' }, { status: 404 });
    }
    
    // Check authorization
    const authorized = 
      auth.role === 'admin' ||
      (auth.role === 'customer' && workOrder.customerId === auth.id) ||
      (auth.role === 'shop' && workOrder.shopId === auth.id) ||
      ((auth.role === 'tech' || auth.role === 'manager') && workOrder.shopId === auth.shopId);
    
    if (!authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    return NextResponse.json(workOrder, { headers: corsHeaders });
  } catch (error) {
    console.error('Error fetching work order:', error);
    return NextResponse.json({ error: 'Failed to fetch work order' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  
  try {
    const { id } = await params;
    const requestData = await request.json();
    
    // Validate input data
    const validation = validateRequest(workOrderUpdateSchema, requestData);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }
    
    const data = validation.data;
    
    // Get current work order
    const current = await prisma.workOrder.findUnique({
      where: { id },
      include: { customer: true, shop: { select: { shopName: true, email: true } } },
    });
    
    if (!current) {
      return NextResponse.json({ error: 'Work order not found' }, { status: 404 });
    }
    
    // Check authorization
    const canUpdate = 
      auth.role === 'admin' ||
      (auth.role === 'shop' && current.shopId === auth.id) ||
      ((auth.role === 'tech' || auth.role === 'manager') && current.shopId === auth.shopId) ||
      (auth.role === 'customer' && current.customerId === auth.id);
    
    if (!canUpdate) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    // Track status change
    if (data.status && data.status !== current.status) {
      await prisma.statusHistory.create({
        data: {
          workOrderId: id,
          fromStatus: current.status,
          toStatus: data.status,
          reason: data.statusReason || 'Status updated',
          changedById: auth.role === 'tech' || auth.role === 'manager' ? auth.id : undefined,
        },
      });
      
      // Send status update email (basic)
      sendStatusUpdateEmail(current.customer.email, id, data.status).catch(console.error);

      // Send branded job-completed email when shop submits estimate and work is done
      if ((data.status as string) === 'waiting-for-payment') {
        const totalDue = (current.estimatedCost || data.estimatedCost || 0) + 5;
        sendJobCompletedEmail(
          current.customer.email,
          `${current.customer.firstName} ${current.customer.lastName}`,
          id,
          totalDue,
          current.shop?.shopName || 'Your Shop',
          current.issueDescription || 'Vehicle Service'
        ).catch(console.error);
        pushJobCompleted(current.customerId, totalDue, id).catch(console.error);
      }
      
      // Create notification
      await prisma.notification.create({
        data: {
          customerId: current.customerId,
          type: 'status_update',
          title: 'Work Order Status Updated',
          message: `Your work order ${id} status changed to ${data.status}`,
          workOrderId: id,
          deliveryMethod: 'in-app',
        },
      });
    }
    
    // Send estimate email if estimated cost added
    if (data.estimatedCost && !current.estimatedCost) {
      // Send branded estimate-ready email via Resend
      const totalDue = data.estimatedCost + 5;
      sendEstimateReadyEmail(
        current.customer.email,
        `${current.customer.firstName} ${current.customer.lastName}`,
        id,
        data.estimatedCost,
        totalDue,
        current.shop?.shopName || 'Your Shop',
        current.issueDescription || 'Vehicle Service'
      ).catch(console.error);
      pushEstimateReady(current.customerId, totalDue, id).catch(console.error);
      
      await prisma.notification.create({
        data: {
          customerId: current.customerId,
          type: 'estimate',
          title: 'Estimate Ready',
          message: `Your estimate for work order ${id} is ready: $${data.estimatedCost}`,
          workOrderId: id,
          deliveryMethod: 'in-app',
        },
      });
    }
    
    const updatedWorkOrder = await prisma.workOrder.update({
      where: { id },
      data: {
        issueDescription: data.issueDescription,
        status: data.status,
        assignedTechId: data.assignedTechId,
        customerId: data.customerId,
        vehicleId: data.vehicleId,
        estimatedCost: data.estimatedCost,
        amountPaid: data.amountPaid,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        completedAt: data.completedAt ? new Date(data.completedAt) : (data.status === 'completed' ? new Date() : undefined),
      },
      include: {
        customer: true,
        shop: true,
        assignedTo: true,
      },
    });

    return NextResponse.json(updatedWorkOrder);
  } catch (error) {
    console.error('Error updating work order:', error);
    return NextResponse.json({ error: 'Failed to update work order' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  
  try {
    const { id } = await params;
    
    const workOrder = await prisma.workOrder.findUnique({
      where: { id },
    });
    
    if (!workOrder) {
      return NextResponse.json({ error: 'Work order not found' }, { status: 404 });
    }
    
    // Only admin or customer who created it can delete
    if (auth.role !== 'admin' && (auth.role !== 'customer' || workOrder.customerId !== auth.id)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    await prisma.workOrder.delete({ where: { id } });
    
    return NextResponse.json({ message: 'Work order deleted' });
  } catch (error) {
    console.error('Error deleting work order:', error);
    return NextResponse.json({ error: 'Failed to delete work order' }, { status: 500 });
  }
}
