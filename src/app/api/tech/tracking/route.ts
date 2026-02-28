import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest, verifyToken } from '@/lib/auth';

// POST /api/tech/tracking - Tech updates their GPS location
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded || !['tech', 'manager'].includes(decoded.role)) {
      return NextResponse.json({ error: 'Tech account required' }, { status: 403 });
    }

    const { workOrderId, latitude, longitude, estimatedArrival } = await request.json();
    if (!workOrderId || latitude == null || longitude == null) {
      return NextResponse.json({ error: 'workOrderId, latitude, longitude are required' }, { status: 400 });
    }

    // Verify work order is assigned to this tech
    const workOrder = await prisma.workOrder.findFirst({
      where: { id: workOrderId, assignedTechId: decoded.id, status: { in: ['in-progress', 'en-route', 'assigned'] } },
    });
    if (!workOrder) {
      return NextResponse.json({ error: 'Work order not found or not assigned to you' }, { status: 404 });
    }

    const tracking = await prisma.techTracking.upsert({
      where: { workOrderId },
      create: {
        workOrderId,
        latitude,
        longitude,
        estimatedArrival: estimatedArrival ? new Date(estimatedArrival) : null,
      },
      update: {
        latitude,
        longitude,
        estimatedArrival: estimatedArrival ? new Date(estimatedArrival) : null,
      },
    });

    return NextResponse.json({ tracking });
  } catch (error) {
    console.error('Tracking update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
