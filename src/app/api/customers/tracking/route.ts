import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { getSocketServer } from '@/lib/socket-server';

// GET /api/customers/tracking - Get real-time tech location for active work order
export async function GET(request: Request) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    console.log('Tracking API - Auth header:', authHeader);
    
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('Tracking API - No Bearer token');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    console.log('Tracking API - Token:', token.substring(0, 20) + '...');
    
    const payload = verifyToken(token);
    console.log('Tracking API - Token payload:', payload);
    console.log('Tracking API - Payload role:', payload?.role);

    if (!payload || payload.role !== 'customer') {
      console.log('Tracking API - Invalid payload or not customer role');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workOrderId = searchParams.get('workOrderId');
    const customerId = searchParams.get('customerId');

    // Find active work orders for customer
    const where: any = {
      status: { in: ['in-progress', 'en-route'] },
      customerId: payload.id, // Only allow access to own work orders
    };

    if (workOrderId) {
      where.id = workOrderId;
    }
    // customerId parameter is ignored since we filter by authenticated user's ID

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
        shop: {
          select: {
            shopName: true,
            phone: true,
            address: true,
          },
        },
        tracking: true,
      },
    });

    if (workOrders.length === 0) {
      return NextResponse.json({ message: 'No active work orders' }, { status: 404 });
    }

    const trackingData = workOrders.map(wo => {
      // If this is an in-shop job, expose shop address and appointment time instead of tech GPS
      const isInShop = wo.serviceLocation && wo.serviceLocation.toLowerCase() !== 'roadside';

      return {
        workOrderId: wo.id,
        issueDescription: wo.issueDescription,
        status: wo.status,
        serviceLocation: wo.serviceLocation,
        tech: wo.assignedTo ? {
          id: wo.assignedTo.id,
          name: `${wo.assignedTo.firstName} ${wo.assignedTo.lastName}`,
          phone: wo.assignedTo.phone,
        } : null,
        shop: {
          shopName: wo.shop.shopName,
          address: wo.shop.address,
          phone: wo.shop.phone,
        },
        serviceTime: wo.dueDate?.toISOString() || wo.createdAt.toISOString(),
        // For in-shop work orders, return shop address (no coordinates); otherwise return tech tracking if available
        location: isInShop ? { shopAddress: wo.shop.address } : (wo.tracking || null),
        estimatedArrival: isInShop ? wo.dueDate?.toISOString() || null : wo.tracking?.estimatedArrival || null,
        isInShop,
      };
    });

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

    // Emit socket event to notify customer (if socket server available)
    try {
      const io = getSocketServer();
      if (io) {
        const wo = await prisma.workOrder.findUnique({ where: { id: workOrderId }, select: { customerId: true } });
        if (wo && wo.customerId) {
          io.to(`user_${wo.customerId}`).emit('tech-location-updated', {
            workOrderId,
            location: { latitude, longitude, estimatedArrival },
            timestamp: new Date().toISOString(),
          });
        }
      }
    } catch (err) {
      console.warn('Failed to emit tech location update via socket server:', err);
    }

    return NextResponse.json(tracking);
  } catch (error) {
    console.error('Error updating tracking:', error);
    return NextResponse.json({ error: 'Failed to update tracking' }, { status: 500 });
  }
}
