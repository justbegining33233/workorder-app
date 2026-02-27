import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole, AuthUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const auth = requireRole(request, ['shop', 'manager', 'admin']);
  if (auth instanceof NextResponse) return auth;

  const user = auth as AuthUser;
  const { searchParams } = new URL(request.url);
  const shopId = user.role === 'admin'
    ? searchParams.get('shopId')
    : (user.shopId ?? user.id);

  if (!shopId) {
    return NextResponse.json({ error: 'Shop ID is required' }, { status: 400 });
  }

  try {
    // Get recent activities from the last 24 hours
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    // Get recent work order status changes
    const workOrderChanges = await prisma.statusHistory.findMany({
      where: {
        workOrder: {
          shopId,
        },
        createdAt: {
          gte: yesterday,
        },
      },
      include: {
        workOrder: {
          include: {
            customer: { select: { firstName: true, lastName: true } },
          },
        },
        changedBy: { select: { id: true, firstName: true, lastName: true, role: true } },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    });

    // Get recent time entries
    const recentTimeEntries = await prisma.timeEntry.findMany({
      where: {
        tech: {
          shopId,
        },
        clockIn: {
          gte: yesterday,
        },
      },
      include: {
        tech: { select: { firstName: true, lastName: true } },
      },
      orderBy: {
        clockIn: 'desc',
      },
      take: 3,
    });

    const activities = [
      ...workOrderChanges.map(change => ({
        id: `status-${change.id}`,
        action: `Work Order Status Changed`,
        details: `${change.workOrder.customer.firstName} ${change.workOrder.customer.lastName} - ${change.fromStatus} → ${change.toStatus}`,
        timestamp: change.createdAt,
        type: 'workorder',
      })),
      ...recentTimeEntries.map(entry => ({
        id: `time-${entry.id}`,
        action: entry.clockOut ? 'Clocked Out' : 'Clocked In',
        details: `${entry.tech.firstName} ${entry.tech.lastName}`,
        timestamp: entry.clockOut || entry.clockIn,
        type: 'time',
      })),
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 8);

    return NextResponse.json({ activities });
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    return NextResponse.json({ error: 'Failed to fetch recent activity' }, { status: 500 });
  }
}