import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/middleware';
import { SUBSCRIPTION_PLANS } from '@/lib/subscription';

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

    // Get subscription statistics
    const totalSubscriptions = await prisma.subscription.count();
    const activeSubscriptions = await prisma.subscription.count({
      where: { status: 'active' }
    });
    const trialingSubscriptions = await prisma.subscription.count({
      where: { status: 'trialing' }
    });
    const cancelledSubscriptions = await prisma.subscription.count({
      where: { status: 'cancelled' }
    });

    // Get subscription revenue (monthly recurring revenue)
    const subscriptionRevenue = await prisma.subscription.findMany({
      where: { status: { in: ['active', 'trialing'] } },
      include: { shop: true }
    });

    const monthlyRecurringRevenue = subscriptionRevenue.reduce((sum, sub) => {
      const planPrice = SUBSCRIPTION_PLANS[sub.plan as keyof typeof SUBSCRIPTION_PLANS]?.price || 0;
      return sum + planPrice;
    }, 0);

    // Get plan distribution
    const planDistribution = await prisma.subscription.groupBy({
      by: ['plan'],
      _count: { plan: true },
      where: { status: { in: ['active', 'trialing'] } }
    });

    // ===== WEEKLY OVERVIEW (Current Week: Sunday - Saturday) =====
    const now = new Date();
    // Get start of current week (Sunday)
    const dayOfWeek = now.getDay(); // 0 = Sunday
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    // Get new clients (shops) this week per day
    const weeklyNewClients = await prisma.shop.findMany({
      where: {
        createdAt: {
          gte: startOfWeek,
          lte: endOfWeek
        }
      },
      select: {
        createdAt: true
      }
    });

    // Group by day of week
    const clientsByDay = [0, 0, 0, 0, 0, 0, 0]; // Sun-Sat
    weeklyNewClients.forEach(shop => {
      const day = new Date(shop.createdAt).getDay();
      clientsByDay[day]++;
    });

    // ===== 3-MONTH AVERAGES =====
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    // Average new customers per month (last 3 months)
    const newClientsLast3Months = await prisma.shop.count({
      where: {
        createdAt: { gte: threeMonthsAgo }
      }
    });
    const avgNewClientsPerMonth = Math.round(newClientsLast3Months / 3);

    // Average income per month (from paid work orders in last 3 months)
    const paidWorkOrdersLast3Months = await prisma.workOrder.findMany({
      where: {
        paymentStatus: 'paid',
        createdAt: { gte: threeMonthsAgo }
      },
      select: {
        amountPaid: true
      }
    });
    const totalIncomeLast3Months = paidWorkOrdersLast3Months.reduce((sum, wo) => sum + (wo.amountPaid || 0), 0);
    const avgIncomePerMonth = totalIncomeLast3Months / 3;

    // Average subscription revenue per month (MRR already calculated)
    const avgSubscriptionRevenue = monthlyRecurringRevenue;

    // Customer churn rate (shops that went from approved to suspended in last 3 months)
    const churnedShops = await prisma.shop.count({
      where: {
        status: 'suspended',
        updatedAt: { gte: threeMonthsAgo }
      }
    });
    const totalActiveClientsStart = await prisma.shop.count({
      where: {
        createdAt: { lt: threeMonthsAgo }
      }
    });
    const churnRate = totalActiveClientsStart > 0 
      ? ((churnedShops / totalActiveClientsStart) * 100).toFixed(1)
      : '0.0';

    // ===== ADDITIONAL LIVE DATA FOR ALL DASHBOARD CARDS =====
    
    // Get last month's data for comparison
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    // Revenue this month vs last month
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const revenueThisMonth = await prisma.workOrder.aggregate({
      _sum: { amountPaid: true },
      where: { paymentStatus: 'paid', createdAt: { gte: startOfThisMonth } }
    });
    const revenueLastMonth = await prisma.workOrder.aggregate({
      _sum: { amountPaid: true },
      where: { paymentStatus: 'paid', createdAt: { gte: startOfLastMonth, lt: startOfThisMonth } }
    });

    const currentMonthRevenue = revenueThisMonth._sum.amountPaid || 0;
    const lastMonthRevenue = revenueLastMonth._sum.amountPaid || 0;
    const revenueGrowth = lastMonthRevenue > 0 
      ? (((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(1)
      : '0.0';

    // Revenue trend for last 7 days
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

    // Subscriptions trend (last 7 days new subscriptions)
    const subscriptionTrend: number[] = [];
    let cumulativeSubs = totalSubscriptions - 7; // Rough starting point
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(now);
      dayStart.setDate(now.getDate() - i);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);
      
      const newSubs = await prisma.subscription.count({
        where: { createdAt: { gte: dayStart, lte: dayEnd } }
      });
      cumulativeSubs += newSubs;
      subscriptionTrend.push(cumulativeSubs > 0 ? cumulativeSubs : totalSubscriptions);
    }

    // New subscriptions this month
    const newSubsThisMonth = await prisma.subscription.count({
      where: { createdAt: { gte: startOfThisMonth } }
    });

    // Retention rate (active shops vs total shops created more than 30 days ago)
    const shopsOlderThan30Days = await prisma.shop.count({
      where: { createdAt: { lt: thirtyDaysAgo } }
    });
    const activeShopsOlderThan30Days = await prisma.shop.count({
      where: { createdAt: { lt: thirtyDaysAgo }, status: 'approved' }
    });
    const retentionRate = shopsOlderThan30Days > 0 
      ? ((activeShopsOlderThan30Days / shopsOlderThan30Days) * 100).toFixed(1)
      : '100.0';

    // Last month retention for comparison
    const shopsOlderThan60Days = await prisma.shop.count({
      where: { createdAt: { lt: twoMonthsAgo } }
    });
    const activeShopsOlderThan60Days = await prisma.shop.count({
      where: { createdAt: { lt: twoMonthsAgo }, status: 'approved' }
    });
    const lastMonthRetention = shopsOlderThan60Days > 0 
      ? ((activeShopsOlderThan60Days / shopsOlderThan60Days) * 100).toFixed(1)
      : '100.0';
    const retentionChange = (parseFloat(retentionRate) - parseFloat(lastMonthRetention)).toFixed(1);

    // Average customer lifetime (months since first approved shop)
    const oldestActiveShop = await prisma.shop.findFirst({
      where: { status: 'approved' },
      orderBy: { approvedAt: 'asc' },
      select: { approvedAt: true }
    });
    const avgLifetimeMonths = oldestActiveShop?.approvedAt 
      ? Math.round((now.getTime() - new Date(oldestActiveShop.approvedAt).getTime()) / (1000 * 60 * 60 * 24 * 30))
      : 0;

    // Reviews/ratings from work orders
    const reviewsCount = await prisma.review.count();
    const avgRating = await prisma.review.aggregate({
      _avg: { rating: true }
    });

    // ===== SALES FUNNEL DATA =====
    
    // 1. Website Visits - from PageView table
    const websiteVisits = await prisma.pageView.count();
    
    // 2. Trials - subscriptions that are trialing (status='trialing' OR trialEnd > now)
    const trialsCount = await prisma.subscription.count({
      where: {
        OR: [
          { status: 'trialing' },
          { trialEnd: { gte: now } }
        ]
      }
    });
    
    // 3. Members - active subscriptions that are NOT in trial period
    const membersCount = await prisma.subscription.count({
      where: {
        status: 'active',
        OR: [
          { trialEnd: null },
          { trialEnd: { lt: now } }
        ]
      }
    });
    
    // 4. Converted Customers - subscriptions that were trials and now active (trialStart is set AND status='active')
    const convertedCustomersCount = await prisma.subscription.count({
      where: {
        status: 'active',
        trialStart: { not: null }
      }
    });

    // Trial signups (shops pending = trials) - kept for compatibility
    const trialSignups = pendingShops;
    
    // Conversion rate (converted from trial / total trials ever)
    const totalShopsEver = await prisma.shop.count();
    
    // Calculate overall conversion rate (trials that converted to active members)
    const totalEverTrialed = await prisma.subscription.count({
      where: { trialStart: { not: null } }
    });
    const conversionRate = totalEverTrialed > 0 
      ? ((convertedCustomersCount / totalEverTrialed) * 100).toFixed(1)
      : (totalShopsEver > 0 ? ((totalShops / totalShopsEver) * 100).toFixed(1) : '0.0');

    // Revenue by plan (calculate actual revenue per plan based on active subscriptions)
    const revenueByPlan: Record<string, number> = {};
    let totalMRR = 0;
    for (const sub of subscriptionRevenue) {
      const planPrice = SUBSCRIPTION_PLANS[sub.plan as keyof typeof SUBSCRIPTION_PLANS]?.price || 0;
      revenueByPlan[sub.plan] = (revenueByPlan[sub.plan] || 0) + planPrice;
      totalMRR += planPrice;
    }

    // Month over month growth
    const shopsLastMonth = await prisma.shop.count({
      where: { createdAt: { gte: startOfLastMonth, lt: startOfThisMonth }, status: 'approved' }
    });
    const shopsThisMonth = await prisma.shop.count({
      where: { createdAt: { gte: startOfThisMonth }, status: 'approved' }
    });
    const momGrowth = shopsLastMonth > 0 
      ? (((shopsThisMonth - shopsLastMonth) / shopsLastMonth) * 100).toFixed(1)
      : '0.0';

    // Year over year growth
    const shopsLastYear = await prisma.shop.count({
      where: { status: 'approved', createdAt: { lt: oneYearAgo } }
    });
    const yoyGrowth = shopsLastYear > 0 
      ? (((totalShops - shopsLastYear) / shopsLastYear) * 100).toFixed(1)
      : '0.0';

    // Calculate LTV (lifetime value) - average revenue per customer
    const avgRevenuePerShop = totalShops > 0 ? totalRevenue / totalShops : 0;
    const ltv = avgRevenuePerShop * (avgLifetimeMonths || 12); // Multiply by avg lifetime

    // Weekly conversion trend (new approved shops per week, last 4 weeks)
    const weeklyConversionTrend: { label: string; value: number }[] = [];
    for (let w = 3; w >= 0; w--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (w * 7) - now.getDay());
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      
      const weekApproved = await prisma.shop.count({
        where: { status: 'approved', approvedAt: { gte: weekStart, lte: weekEnd } }
      });
      weeklyConversionTrend.push({ label: `W${4 - w}`, value: weekApproved });
    }

    return NextResponse.json({
      totalRevenue: `$${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      totalRevenueRaw: totalRevenue,
      totalShops,
      totalJobs,
      activeUsers,
      pendingShops,
      systemHealth: 100,
      recentActivity,
      // Subscription stats
      totalSubscriptions,
      activeSubscriptions,
      trialingSubscriptions,
      cancelledSubscriptions,
      newSubsThisMonth,
      monthlyRecurringRevenue: `$${monthlyRecurringRevenue.toFixed(2)}`,
      monthlyRecurringRevenueRaw: monthlyRecurringRevenue,
      planDistribution: planDistribution.reduce((acc, item) => {
        acc[item.plan] = item._count.plan;
        return acc;
      }, {} as Record<string, number>),
      // Weekly overview
      weeklyOverview: {
        weekStart: startOfWeek.toISOString(),
        weekEnd: endOfWeek.toISOString(),
        newClientsByDay: clientsByDay,
        totalNewClientsThisWeek: weeklyNewClients.length
      },
      // 3-month averages
      threeMonthAverages: {
        avgNewClientsPerMonth,
        avgJobIncomePerMonth: `$${avgIncomePerMonth.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        avgSubscriptionRevenuePerMonth: `$${avgSubscriptionRevenue.toFixed(2)}`,
        churnRate: `${churnRate}%`,
        churnRateRaw: parseFloat(churnRate),
        totalClientsLast3Months: newClientsLast3Months,
        totalJobIncomeLast3Months: `$${totalIncomeLast3Months.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      },
      // Live metrics for all cards
      liveMetrics: {
        // Revenue card
        revenueTrend,
        revenueGrowth: `${parseFloat(revenueGrowth) >= 0 ? '+' : ''}${revenueGrowth}%`,
        currentMonthRevenue,
        lastMonthRevenue,
        // Subscriptions card
        subscriptionTrend,
        // Retention card
        retentionRate: `${retentionRate}%`,
        retentionRateRaw: parseFloat(retentionRate),
        retentionChange: `${parseFloat(retentionChange) >= 0 ? '+' : ''}${retentionChange}%`,
        avgLifetimeMonths,
        // Satisfaction card
        avgRating: avgRating._avg.rating?.toFixed(1) || '0.0',
        reviewsCount,
        // Sales funnel (new metrics)
        websiteVisits,
        trialsCount,
        membersCount,
        convertedCustomersCount,
        // Legacy sales funnel (kept for compatibility)
        totalShopsEver,
        trialSignups,
        activeTrials: trialingSubscriptions,
        convertedCustomers: totalShops,
        conversionRate: `${conversionRate}%`,
        // Revenue by plan
        revenueByPlan,
        totalMRR,
        annualRecurringRevenue: totalMRR * 12,
        // Growth metrics
        momGrowth: `${parseFloat(momGrowth) >= 0 ? '+' : ''}${momGrowth}%`,
        yoyGrowth: `${parseFloat(yoyGrowth) >= 0 ? '+' : ''}${yoyGrowth}%`,
        ltv: `$${ltv.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
        weeklyConversionTrend
      }
    });
  } catch (error) {
    console.error('Error fetching platform stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch platform statistics' },
      { status: 500 }
    );
  }
}
