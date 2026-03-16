import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  // Require admin or shop authentication for analytics
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  if (auth.role !== 'admin' && auth.role !== 'shop' && auth.role !== 'superadmin') {
    return NextResponse.json({ error: 'Unauthorized - Admin or Shop access only' }, { status: 403 });
  }

  try {
    // Build where clause based on role
    const where: Record<string, unknown> = {};
    if (auth.role === 'shop') {
      where.shopId = auth.id;
    }

    const workOrders = await prisma.workOrder.findMany({
      where,
      include: {
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    // Calculate stats
    const closedOrders = workOrders.filter(wo => wo.status === 'closed');
    const inProgressOrders = workOrders.filter(wo => wo.status === 'in-progress');
    const pendingOrders = workOrders.filter(wo => wo.status === 'pending');

    // Revenue — estimate is a Json? field, try to extract amount
    const totalRevenue = closedOrders.reduce((sum, wo) => {
      const est = wo.estimate as Record<string, unknown> | null;
      return sum + (Number(est?.amount) || wo.estimatedCost || 0);
    }, 0);
    const averageJobValue = closedOrders.length > 0 ? totalRevenue / closedOrders.length : 0;

    // Completion time
    const completionTimes = closedOrders
      .filter(wo => wo.createdAt && wo.updatedAt)
      .map(wo => {
        const created = new Date(wo.createdAt).getTime();
        const updated = new Date(wo.updatedAt).getTime();
        return (updated - created) / (1000 * 60 * 60); // hours
      });
    const avgCompletionTime = completionTimes.length > 0 
      ? completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length 
      : 0;

    // Tech performance
    const techPerformance: Record<string, { completed: number; totalRevenue: number; avgTime: number }> = {};
    closedOrders.forEach(wo => {
      const techName = wo.assignedTo ? `${wo.assignedTo.firstName} ${wo.assignedTo.lastName}` : 'Unassigned';
      if (!techPerformance[techName]) {
        techPerformance[techName] = { completed: 0, totalRevenue: 0, avgTime: 0 };
      }
      techPerformance[techName].completed++;
      const est = wo.estimate as Record<string, unknown> | null;
      techPerformance[techName].totalRevenue += Number(est?.amount) || wo.estimatedCost || 0;
    });

    // Calculate average time per tech
    Object.keys(techPerformance).forEach(tech => {
      const techOrders = closedOrders.filter(wo => {
        const name = wo.assignedTo ? `${wo.assignedTo.firstName} ${wo.assignedTo.lastName}` : 'Unassigned';
        return name === tech;
      });
      const times = techOrders
        .filter(wo => wo.createdAt && wo.updatedAt)
        .map(wo => {
          const created = new Date(wo.createdAt).getTime();
          const updated = new Date(wo.updatedAt).getTime();
          return (updated - created) / (1000 * 60 * 60);
        });
      techPerformance[tech].avgTime = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
    });

    // SLA compliance — use dueDate as the promised completion date
    const slaCompliant = closedOrders.filter(wo => {
      if (!wo.dueDate) return false;
      const promised = new Date(wo.dueDate).getTime();
      const actual = new Date(wo.updatedAt).getTime();
      return actual <= promised;
    }).length;

    return NextResponse.json({
      summary: {
        totalOrders: workOrders.length,
        closedOrders: closedOrders.length,
        inProgressOrders: inProgressOrders.length,
        pendingOrders: pendingOrders.length,
        totalRevenue: totalRevenue.toFixed(2),
        averageJobValue: averageJobValue.toFixed(2),
        averageCompletionTime: avgCompletionTime.toFixed(1),
        slaCompliance: closedOrders.length > 0 ? ((slaCompliant / closedOrders.length) * 100).toFixed(1) : 'N/A',
      },
      techPerformance,
      completionTimeDistribution: {
        under24h: completionTimes.filter(t => t < 24).length,
        under48h: completionTimes.filter(t => t >= 24 && t < 48).length,
        under1week: completionTimes.filter(t => t >= 48 && t < 168).length,
        over1week: completionTimes.filter(t => t >= 168).length,
      }
    });
  } catch (error) {
    console.error('Error calculating analytics:', error);
    return NextResponse.json({ error: 'Failed to calculate analytics' }, { status: 500 });
  }
}
