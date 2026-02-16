import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shopId');

    if (!shopId) {
      return NextResponse.json({ error: 'Shop ID is required' }, { status: 400 });
    }

    const alerts = [];

    // Check for overdue work orders
    const overdueJobs = await prisma.workOrder.count({
      where: {
        shopId,
        status: { not: 'closed' },
        dueDate: {
          lt: new Date(),
        },
      },
    });

    if (overdueJobs > 0) {
      alerts.push({
        id: 'overdue-jobs',
        title: 'Overdue Work Orders',
        message: `You have ${overdueJobs} work order${overdueJobs > 1 ? 's' : ''} past their due date.`,
        type: 'warning',
        createdAt: new Date(),
      });
    }

    // Check for low inventory
    const lowStockItems = await prisma.inventoryItem.count({
      where: {
        shopId,
        quantity: {
          lte: 5, // Assuming reorder point
        },
      },
    });

    if (lowStockItems > 0) {
      alerts.push({
        id: 'low-inventory',
        title: 'Low Inventory Alert',
        message: `${lowStockItems} item${lowStockItems > 1 ? 's are' : ' is'} running low on stock.`,
        type: 'warning',
        createdAt: new Date(),
      });
    }

    // Check for pending inventory requests
    const pendingRequests = await prisma.inventoryRequest.count({
      where: {
        shopId,
        status: 'pending',
      },
    });

    if (pendingRequests > 0) {
      alerts.push({
        id: 'pending-requests',
        title: 'Pending Inventory Requests',
        message: `${pendingRequests} inventory request${pendingRequests > 1 ? 's are' : ' is'} awaiting approval.`,
        type: 'info',
        createdAt: new Date(),
      });
    }

    // Check for unassigned work orders
    const unassignedJobs = await prisma.workOrder.count({
      where: {
        shopId,
        status: 'pending',
        assignedTechId: null,
      },
    });

    if (unassignedJobs > 0) {
      alerts.push({
        id: 'unassigned-jobs',
        title: 'Unassigned Work Orders',
        message: `${unassignedJobs} work order${unassignedJobs > 1 ? 's' : ''} need${unassignedJobs > 1 ? '' : 's'} to be assigned.`,
        type: 'warning',
        createdAt: new Date(),
      });
    }

    return NextResponse.json({ alerts });
  } catch (error) {
    console.error('Error fetching urgent alerts:', error);
    return NextResponse.json({ error: 'Failed to fetch urgent alerts' }, { status: 500 });
  }
}