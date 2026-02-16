import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  // Only admins can access revenue data
  if (auth.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get subscription stats
    const subscriptions = await prisma.subscription.findMany({
      where: {
        status: { in: ['active', 'trialing'] }
      },
      include: {
        shop: {
          select: {
            id: true,
            shopName: true,
            email: true
          }
        }
      }
    });

    // Get all subscriptions for lifecycle stats
    const allSubscriptions = await prisma.subscription.findMany();
    const activeSubscriptions = allSubscriptions.filter(s => s.status === 'active');
    const trialingSubscriptions = allSubscriptions.filter(s => s.status === 'trialing');
    const canceledSubscriptions = allSubscriptions.filter(s => s.status === 'cancelled' || s.status === 'canceled');

    // Plan pricing
    const planPricing: Record<string, number> = {
      starter: 99,
      growth: 199,
      professional: 349,
      business: 599,
      enterprise: 999
    };

    // Calculate Monthly Recurring Revenue (MRR)
    let mrr = 0;
    const planBreakdown: Record<string, { count: number; revenue: number }> = {};

    subscriptions.forEach(sub => {
      const plan = sub.plan.toLowerCase();
      const price = planPricing[plan] || 0;
      mrr += price;

      if (!planBreakdown[plan]) {
        planBreakdown[plan] = { count: 0, revenue: 0 };
      }
      planBreakdown[plan].count++;
      planBreakdown[plan].revenue += price;
    });

    // Get payment history if available
    let recentPayments: any[] = [];
    try {
      recentPayments = await prisma.paymentHistory.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' }
      });
    } catch (e) {
      // PaymentHistory table might not exist yet
    }

    // Calculate totals
    const totalRevenue = recentPayments
      .filter(p => p.status === 'succeeded')
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    // Stripe fees (approximately 2.9% + $0.30 per transaction)
    const stripeFeePercent = 0.029;
    const stripeFeeFixed = 0.30;
    const estimatedStripeFees = recentPayments
      .filter(p => p.status === 'succeeded')
      .reduce((sum, p) => sum + (p.amount * stripeFeePercent + stripeFeeFixed), 0);

    const netRevenue = totalRevenue - estimatedStripeFees;

    // Annual Recurring Revenue
    const arr = mrr * 12;

    // ===== NEW LIVE METRICS =====
    
    // Revenue trend (last 7 days from work orders)
    const revenueTrend: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(now);
      dayStart.setDate(now.getDate() - i);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);
      
      const dayRevenue = await prisma.workOrder.aggregate({
        _sum: { amountPaid: true },
        where: { paymentStatus: 'paid', createdAt: { gte: dayStart, lte: dayEnd } }
      });
      revenueTrend.push(dayRevenue._sum.amountPaid || 0);
    }

    // MoM Growth - compare new subs this month vs last month
    const subsThisMonth = await prisma.subscription.count({
      where: { createdAt: { gte: startOfThisMonth } }
    });
    const subsLastMonth = await prisma.subscription.count({
      where: { createdAt: { gte: startOfLastMonth, lt: startOfThisMonth } }
    });
    const momGrowth = subsLastMonth > 0 
      ? (((subsThisMonth - subsLastMonth) / subsLastMonth) * 100).toFixed(1)
      : '0.0';

    // YoY Growth
    const subsLastYear = await prisma.subscription.count({
      where: { createdAt: { lt: oneYearAgo } }
    });
    const yoyGrowth = subsLastYear > 0 
      ? (((allSubscriptions.length - subsLastYear) / subsLastYear) * 100).toFixed(1)
      : '0.0';

    // Churn rate (cancelled in last 3 months / total at start of period)
    const churnedLast3Months = await prisma.subscription.count({
      where: { 
        status: { in: ['cancelled', 'canceled'] },
        canceledAt: { gte: threeMonthsAgo }
      }
    });
    const totalAtStartOf3Months = await prisma.subscription.count({
      where: { createdAt: { lt: threeMonthsAgo } }
    });
    const churnRate = totalAtStartOf3Months > 0 
      ? ((churnedLast3Months / totalAtStartOf3Months) * 100).toFixed(1)
      : '0.0';

    // Retention rate
    const shopsOlderThan30Days = await prisma.shop.count({
      where: { createdAt: { lt: thirtyDaysAgo } }
    });
    const activeShopsOlderThan30Days = await prisma.shop.count({
      where: { createdAt: { lt: thirtyDaysAgo }, status: 'approved' }
    });
    const retentionRate = shopsOlderThan30Days > 0 
      ? ((activeShopsOlderThan30Days / shopsOlderThan30Days) * 100).toFixed(1)
      : '100.0';

    // Conversion rate (trial to paid)
    const totalEverTrialed = await prisma.subscription.count({
      where: { trialStart: { not: null } }
    });
    const convertedFromTrial = await prisma.subscription.count({
      where: { 
        status: 'active',
        trialStart: { not: null }
      }
    });
    const conversionRate = totalEverTrialed > 0 
      ? ((convertedFromTrial / totalEverTrialed) * 100).toFixed(1)
      : '0.0';

    // Average revenue per user (ARPU)
    const arpu = activeSubscriptions.length > 0 
      ? mrr / activeSubscriptions.length
      : 0;

    // Lifetime value estimate (ARPU * avg lifetime in months)
    const oldestActiveShop = await prisma.shop.findFirst({
      where: { status: 'approved' },
      orderBy: { approvedAt: 'asc' },
      select: { approvedAt: true }
    });
    const avgLifetimeMonths = oldestActiveShop?.approvedAt 
      ? Math.round((now.getTime() - new Date(oldestActiveShop.approvedAt).getTime()) / (1000 * 60 * 60 * 24 * 30))
      : 12;
    const ltv = arpu * Math.max(avgLifetimeMonths, 12);

    // New subscriptions this month
    const newSubsThisMonth = subsThisMonth;

    // Revenue by time period
    const revenueThisMonth = await prisma.workOrder.aggregate({
      _sum: { amountPaid: true },
      where: { paymentStatus: 'paid', createdAt: { gte: startOfThisMonth } }
    });
    const revenueLastMonth = await prisma.workOrder.aggregate({
      _sum: { amountPaid: true },
      where: { paymentStatus: 'paid', createdAt: { gte: startOfLastMonth, lt: startOfThisMonth } }
    });
    const revenueLast3Months = await prisma.workOrder.aggregate({
      _sum: { amountPaid: true },
      where: { paymentStatus: 'paid', createdAt: { gte: threeMonthsAgo } }
    });

    return NextResponse.json({
      success: true,
      revenue: {
        mrr,
        arr,
        totalActiveSubscriptions: subscriptions.length,
        planBreakdown,
        recentPayments: recentPayments.map(p => ({
          id: p.id,
          shopName: p.shop?.shopName || 'Unknown',
          amount: p.amount,
          status: p.status,
          date: p.paidAt || p.createdAt
        })),
        totals: {
          grossRevenue: totalRevenue,
          estimatedStripeFees: Math.round(estimatedStripeFees * 100) / 100,
          netRevenue: Math.round(netRevenue * 100) / 100
        }
      },
      // NEW: Live metrics
      liveMetrics: {
        revenueTrend,
        momGrowth: `${parseFloat(momGrowth) >= 0 ? '+' : ''}${momGrowth}%`,
        yoyGrowth: `${parseFloat(yoyGrowth) >= 0 ? '+' : ''}${yoyGrowth}%`,
        churnRate: `${churnRate}%`,
        retentionRate: `${retentionRate}%`,
        conversionRate: `${conversionRate}%`,
        arpu: Math.round(arpu),
        ltv: Math.round(ltv),
        avgLifetimeMonths,
        newSubsThisMonth,
        activeSubscriptions: activeSubscriptions.length,
        trialingSubscriptions: trialingSubscriptions.length,
        canceledSubscriptions: canceledSubscriptions.length,
        revenueThisMonth: revenueThisMonth._sum.amountPaid || 0,
        revenueLastMonth: revenueLastMonth._sum.amountPaid || 0,
        revenueLast3Months: revenueLast3Months._sum.amountPaid || 0
      },
      stripeLinks: {
        dashboard: 'https://dashboard.stripe.com',
        payments: 'https://dashboard.stripe.com/payments',
        subscriptions: 'https://dashboard.stripe.com/subscriptions',
        payouts: 'https://dashboard.stripe.com/payouts',
        balances: 'https://dashboard.stripe.com/balance/overview'
      }
    });
  } catch (error) {
    console.error('Revenue API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch revenue data' },
      { status: 500 }
    );
  }
}
