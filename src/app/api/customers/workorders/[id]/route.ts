import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    if (!payload || payload.role !== 'customer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: workOrderId } = await params;

    // Fetch work order with related data
    const workOrder = await prisma.workOrder.findUnique({
      where: { id: workOrderId },
      include: {
        shop: {
          select: {
            shopName: true,
            phone: true,
            address: true,
          },
        },
        assignedTo: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        vehicle: {
          select: {
            make: true,
            model: true,
            year: true,
            licensePlate: true,
          },
        },
        tracking: {
          select: {
            latitude: true,
            longitude: true,
            estimatedArrival: true,
          }
        },
      },
    });

    if (!workOrder) {
      return NextResponse.json({ error: 'Work order not found' }, { status: 404 });
    }

    // Verify the work order belongs to the authenticated customer
    if (workOrder.customerId !== payload.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Format the response
    const response = {
      id: workOrder.id,
      issueDescription: workOrder.issueDescription,
      status: workOrder.status,
      serviceType: workOrder.maintenance || workOrder.repairs || 'General Service',
      scheduledDate: workOrder.dueDate?.toISOString() || workOrder.createdAt.toISOString(),
      createdAt: workOrder.createdAt.toISOString(),
      shop: workOrder.shop,
      assignedTo: workOrder.assignedTo,
      vehicle: workOrder.vehicle,
      tracking: workOrder.tracking || null,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching work order details:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}