import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shopId');

    if (!shopId) {
      return NextResponse.json({ error: 'Shop ID is required' }, { status: 400 });
    }

    // Get work order statistics
    const [activeJobs, pendingAssignments, overdueJobs, completedToday] = await Promise.all([
      // Active jobs (in-progress or assigned)
      prisma.workOrder.count({
        where: {
          shopId,
          status: { in: ['assigned', 'in-progress'] },
        },
      }),

      // Pending assignments (pending status)
      prisma.workOrder.count({
        where: {
          shopId,
          status: 'pending',
        },
      }),

      // Overdue jobs (past due date and not completed)
      prisma.workOrder.count({
        where: {
          shopId,
          status: { not: 'closed' },
          dueDate: {
            lt: new Date(),
          },
        },
      }),

      // Completed today
      prisma.workOrder.count({
        where: {
          shopId,
          status: 'closed',
          updatedAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    ]);

    const stats = {
      activeJobs,
      pendingAssignments,
      overdueJobs,
      completedToday,
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error fetching work order stats:', error);
    return NextResponse.json({ error: 'Failed to fetch work order stats' }, { status: 500 });
  }
}