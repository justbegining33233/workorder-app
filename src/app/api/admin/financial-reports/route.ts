import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all work orders with payment info
    const workOrders = await prisma.workOrder.findMany({
      where: {
        paymentStatus: 'paid',
      },
      include: {
        shop: {
          select: {
            shopName: true,
          },
        },
      },
    });

    // Calculate total revenue
    const totalRevenue = workOrders.reduce((sum, wo) => sum + (wo.amountPaid || 0), 0);
    
    // Calculate platform fees (20% commission)
    const platformFees = totalRevenue * 0.2;
    
    // Calculate total payouts to shops (80%)
    const totalPayouts = totalRevenue * 0.8;

    // Get pending work orders for pending payouts
    const pendingWorkOrders = await prisma.workOrder.findMany({
      where: {
        paymentStatus: 'pending',
      },
    });
    const pendingPayouts = pendingWorkOrders.reduce((sum, wo) => sum + (wo.amountPaid || 0), 0) * 0.8;

    // Calculate average transaction
    const averageTransaction = workOrders.length > 0 ? totalRevenue / workOrders.length : 0;

    // Get monthly revenue for last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyRevenue = await prisma.workOrder.groupBy({
      by: ['createdAt'],
      where: {
        paymentStatus: 'paid',
        createdAt: {
          gte: sixMonthsAgo,
        },
      },
      _sum: {
        amountPaid: true,
      },
    });

    // Group by month
    const monthlyData: { [key: string]: number } = {};
    monthlyRevenue.forEach((item) => {
      const date = new Date(item.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + (item._sum?.amountPaid || 0);
    });

    // Format monthly data
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formattedMonthlyData = Object.entries(monthlyData).map(([key, revenue]) => {
      const [year, month] = key.split('-');
      const monthName = months[parseInt(month) - 1];
      const payouts = revenue * 0.8;
      const fees = revenue * 0.2;
      
      return {
        month: `${monthName} ${year}`,
        revenue: `$${revenue.toFixed(2)}`,
        payouts: `$${payouts.toFixed(2)}`,
        fees: `$${fees.toFixed(2)}`,
      };
    }).slice(-6); // Last 6 months

    // Get top earning shops
    const shopRevenue = await prisma.workOrder.groupBy({
      by: ['shopId'],
      where: {
        paymentStatus: 'paid',
        shopId: { not: '' }, // Not empty string
      },
      _sum: {
        amountPaid: true,
      },
      orderBy: {
        _sum: {
          amountPaid: 'desc',
        },
      },
      take: 5,
    });

    // Get shop names and format data
    const topEarningShops = await Promise.all(
      shopRevenue.map(async (item) => {
        const shop = await prisma.shop.findUnique({
          where: { id: item.shopId as string },
          select: { shopName: true },
        });
        
        const revenue = item._sum?.amountPaid || 0;
        const fees = revenue * 0.2;
        const payout = revenue * 0.8;
        
        return {
          name: shop?.shopName || 'Unknown Shop',
          revenue: `$${revenue.toFixed(2)}`,
          fees: `$${fees.toFixed(2)}`,
          payout: `$${payout.toFixed(2)}`,
        };
      })
    );

    return NextResponse.json({
      totalRevenue: `$${totalRevenue.toFixed(2)}`,
      totalPayouts: `$${totalPayouts.toFixed(2)}`,
      platformFees: `$${platformFees.toFixed(2)}`,
      pendingPayouts: `$${pendingPayouts.toFixed(2)}`,
      averageTransaction: `$${averageTransaction.toFixed(2)}`,
      transactionCount: workOrders.length,
      monthlyData: formattedMonthlyData,
      topEarningShops,
    });
  } catch (error) {
    console.error('Error fetching financial reports:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
