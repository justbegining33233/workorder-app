import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// GET - Get manager dashboard data
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || (decoded.role !== 'manager' && decoded.role !== 'shop')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const shopId = decoded.shopId;
    if (!shopId) {
      return NextResponse.json({ error: 'Shop ID not found' }, { status: 400 });
    }

    // Get work orders summary
    const workOrders = await prisma.workOrder.findMany({
      where: { shopId },
      include: {
        customer: {
          select: { firstName: true, lastName: true },
        },
        assignedTo: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const openJobs = workOrders.filter((wo) => wo.status === 'in-progress' || wo.status === 'assigned').length;
    const pendingJobs = workOrders.filter((wo) => wo.status === 'pending').length;
    const completedToday = workOrders.filter(
      (wo) =>
        wo.status === 'closed' &&
        wo.completedAt &&
        new Date(wo.completedAt).toDateString() === new Date().toDateString()
    ).length;

    // Get team members
    const techs = await prisma.tech.findMany({
      where: { shopId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        assignedWorkOrders: {
          where: {
            status: { in: ['assigned', 'in-progress'] },
          },
          select: { id: true },
        },
      },
    });

    // Get pending inventory requests
    const inventoryRequests = await prisma.inventoryRequest.findMany({
      where: {
        shopId,
        status: 'pending',
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    return NextResponse.json({
      stats: {
        openJobs,
        pendingJobs,
        completedToday,
        totalTechs: techs.length,
        activeTechs: techs.filter((t) => t.assignedWorkOrders.length > 0).length,
        pendingInventoryRequests: inventoryRequests.length,
      },
      recentWorkOrders: workOrders.slice(0, 10),
      teamMembers: techs,
      inventoryRequests,
    });
  } catch (error) {
    console.error('Error fetching manager dashboard:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
