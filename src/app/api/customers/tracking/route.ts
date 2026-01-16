import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/customers/tracking - Get real-time tech location for active work order
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const workOrderId = searchParams.get('workOrderId');
    const customerId = searchParams.get('customerId');

    if (!workOrderId && !customerId) {
      return NextResponse.json(
        { error: 'Work Order ID or Customer ID required' },
        { status: 400 }
      );
    }

    // Find active work orders for customer
    const where: any = {
      status: { in: ['In Progress', 'En Route'] },
    };

    if (workOrderId) {
      where.id = workOrderId;
    } else if (customerId) {
      where.customerId = customerId;
    }

    const workOrders = await prisma.workOrder.findMany({
      where,
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        tracking: true,
      },
    });

    if (workOrders.length === 0) {
      return NextResponse.json({ message: 'No active work orders' }, { status: 404 });
    }

    const trackingData = workOrders.map(wo => ({
      workOrderId: wo.id,
      issueDescription: wo.issueDescription,
      status: wo.status,
      tech: wo.assignedTo ? {
        id: wo.assignedTo.id,
        name: `${wo.assignedTo.firstName} ${wo.assignedTo.lastName}`,
        phone: wo.assignedTo.phone,
      } : null,
      location: wo.tracking || null,
      estimatedArrival: wo.tracking?.estimatedArrival || null,
    }));

    return NextResponse.json(trackingData);
  } catch (error) {
    console.error('Error fetching tracking data:', error);
    return NextResponse.json({ error: 'Failed to fetch tracking data' }, { status: 500 });
  }
}

// POST /api/customers/tracking - Update tech location (called by tech)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { workOrderId, latitude, longitude, estimatedArrival } = body;

    if (!workOrderId || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { error: 'Work Order ID, latitude, and longitude required' },
        { status: 400 }
      );
    }

    // Find existing tracking or create new
    const existingTracking = await prisma.techTracking.findFirst({
      where: { workOrderId },
    });

    let tracking;
    if (existingTracking) {
      tracking = await prisma.techTracking.update({
        where: { id: existingTracking.id },
        data: {
          latitude,
          longitude,
          estimatedArrival,
          updatedAt: new Date(),
        },
      });
    } else {
      tracking = await prisma.techTracking.create({
        data: {
          workOrderId,
          latitude,
          longitude,
          estimatedArrival,
        },
      });
    }

    return NextResponse.json(tracking);
  } catch (error) {
    console.error('Error updating tracking:', error);
    return NextResponse.json({ error: 'Failed to update tracking' }, { status: 500 });
  }
}
