import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  // Only super admins can access platform stats
  if (auth.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    // Get total shops (approved only)
    const totalShops = await prisma.shop.count({
      where: { status: 'approved' }
    });

    // Get pending shops
    const pendingShops = await prisma.shop.count({
      where: { status: 'pending' }
    });

    // Get total work orders
    const totalJobs = await prisma.workOrder.count();

    // Get active users (customers who have created work orders in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const activeUsers = await prisma.customer.count({
      where: {
        workOrders: {
          some: {
            createdAt: {
              gte: thirtyDaysAgo
            }
          }
        }
      }
    });

    // Get total revenue from paid work orders
    const paidWorkOrders = await prisma.workOrder.findMany({
      where: {
        paymentStatus: 'paid'
      },
      select: {
        amountPaid: true
      }
    });

    const totalRevenue = paidWorkOrders.reduce((sum, wo) => {
      return sum + (wo.amountPaid || 0);
    }, 0);

    // Get recent activity (last 10 work orders)
    const recentWorkOrders = await prisma.workOrder.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        shop: {
          select: {
            shopName: true
          }
        }
      }
    });

    const recentActivity = recentWorkOrders.map(wo => ({
      type: 'workorder',
      action: `Work Order Created`,
      details: `${wo.customer.firstName} ${wo.customer.lastName} at ${wo.shop.shopName}`,
      time: wo.createdAt.toISOString()
    }));

    return NextResponse.json({
      totalRevenue: `$${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      totalShops,
      totalJobs,
      activeUsers,
      pendingShops,
      systemHealth: 100,
      recentActivity
    });
  } catch (error) {
    console.error('Error fetching platform stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch platform statistics' },
      { status: 500 }
    );
  }
}
