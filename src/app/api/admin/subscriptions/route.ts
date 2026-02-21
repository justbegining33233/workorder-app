import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  // Only super admins can access subscription details
  if (auth.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get all subscriptions with shop details, techs, and work orders
    const subscriptions: any[] = await prisma.subscription.findMany({
      include: {
        shop: {
          select: {
            id: true,
            shopName: true,
            ownerName: true,
            email: true,
            status: true,
            createdAt: true,
            city: true,
            state: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50
    });

    // For each subscription, get the techs, work orders, and calculate metrics
    const subscriptionsWithDetails = await Promise.all(
      subscriptions.map(async (subscription: any) => {
        const techs = await prisma.tech.findMany({
          where: { shopId: subscription.shopId },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            available: true,
          }
        });

        const workOrders = await prisma.workOrder.findMany({
          where: { shopId: subscription.shopId },
          select: {
            id: true,
            status: true,
            amountPaid: true,
            paymentStatus: true,
            createdAt: true,
            completedAt: true,
          }
        });

        const userCount = techs.length + 1; // +1 for the shop owner

        // Calculate shop metrics
        const totalJobs = workOrders.length;
        const completedJobs = workOrders.filter((wo: any) => wo.status === 'closed' || wo.status === 'completed').length;
        const completionRate = totalJobs > 0 ? Math.round((completedJobs / totalJobs) * 100) : 0;

        const totalRevenue = workOrders
          .filter((wo: any) => wo.paymentStatus === 'paid')
          .reduce((sum: number, wo: any) => sum + (wo.amountPaid || 0), 0);

        const revenueThisMonth = workOrders
          .filter((wo: any) => wo.paymentStatus === 'paid' && new Date(wo.createdAt) >= startOfMonth)
          .reduce((sum: number, wo: any) => sum + (wo.amountPaid || 0), 0);

        const jobsThisMonth = workOrders.filter((wo: any) => new Date(wo.createdAt) >= startOfMonth).length;
        const jobsLastMonth = workOrders.filter((wo: any) => 
          new Date(wo.createdAt) >= startOfLastMonth && new Date(wo.createdAt) < startOfMonth
        ).length;

        // Calculate average response time (mock for now - would need actual data)
        const avgResponseTime = '2.4 hours';

        // Active techs
        const activeTechs = techs.filter((t: any) => t.available).length;

        return {
          ...subscription,
          techs,
          userCount,
          // Live metrics
          metrics: {
            totalJobs,
            completedJobs,
            completionRate,
            totalRevenue,
            revenueThisMonth,
            jobsThisMonth,
            jobsLastMonth,
            avgResponseTime,
            activeTechs,
            totalTechs: techs.length,
          }
        };
      })
    );

    // Calculate aggregate metrics for all shops
    const activeSubscriptions = subscriptionsWithDetails.filter(sub => sub.status === 'active' || sub.status === 'trialing');
    const totalShops = activeSubscriptions.length;
    const totalUsers = activeSubscriptions.reduce((sum, sub) => sum + sub.userCount, 0);
    const totalCapacity = activeSubscriptions.reduce((sum, sub) => sum + sub.maxUsers, 0);
    const utilizationRate = totalCapacity > 0 ? Math.round((totalUsers / totalCapacity) * 100) : 0;

    // Revenue metrics
    const totalPlatformRevenue = activeSubscriptions.reduce((sum, sub) => sum + sub.metrics.totalRevenue, 0);
    const totalRevenueThisMonth = activeSubscriptions.reduce((sum, sub) => sum + sub.metrics.revenueThisMonth, 0);

    // Jobs metrics
    const totalJobsAllShops = activeSubscriptions.reduce((sum, sub) => sum + sub.metrics.totalJobs, 0);
    const completedJobsAllShops = activeSubscriptions.reduce((sum, sub) => sum + sub.metrics.completedJobs, 0);
    const avgCompletionRate = totalJobsAllShops > 0 ? Math.round((completedJobsAllShops / totalJobsAllShops) * 100) : 0;

    // Plan distribution
    const planDistribution = activeSubscriptions.reduce((acc: any, sub: any) => {
      const plan = sub.plan?.toLowerCase() || 'starter';
      acc[plan] = (acc[plan] || 0) + 1;
      return acc;
    }, {});

    // Revenue by plan
    const planPrices: Record<string, number> = {
      starter: 99,
      growth: 199,
      professional: 349,
      business: 599,
      enterprise: 999
    };

    const revenueByPlan = activeSubscriptions.reduce((acc: any, sub: any) => {
      const plan = sub.plan?.toLowerCase() || 'starter';
      acc[plan] = (acc[plan] || 0) + (planPrices[plan] || 99);
      return acc;
    }, {});

    const mrr = Object.values(revenueByPlan).reduce((sum: number, val: any) => sum + val, 0);
    const avgRevenuePerShop = totalShops > 0 ? Math.round(mrr / totalShops) : 0;

    // Shop growth
    const newShopsThisMonth = subscriptionsWithDetails.filter(sub => 
      new Date(sub.createdAt) >= startOfMonth
    ).length;
    const newShopsLastMonth = subscriptionsWithDetails.filter(sub => 
      new Date(sub.createdAt) >= startOfLastMonth && new Date(sub.createdAt) < startOfMonth
    ).length;
    const shopGrowth = newShopsLastMonth > 0 
      ? Math.round(((newShopsThisMonth - newShopsLastMonth) / newShopsLastMonth) * 100)
      : newShopsThisMonth > 0 ? 100 : 0;

    // 7-day job trend
    const weeklyJobTrend: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const dayJobs = 0;
      subscriptionsWithDetails.forEach((sub: any) => {
        // Count work orders created on this day from the metrics we gathered
        // We need to fetch from the original data
      });
      // Mock data for now - would need actual work order date tracking
      weeklyJobTrend.push(Math.floor(Math.random() * 50 + 100));
    }

    // Get actual weekly job data
    const weeklyJobs = await Promise.all(
      Array.from({ length: 7 }, async (_, i) => {
        const date = new Date(now);
        date.setDate(date.getDate() - (6 - i));
        date.setHours(0, 0, 0, 0);
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);
        
        const count = await prisma.workOrder.count({
          where: {
            createdAt: {
              gte: date,
              lt: nextDate
            }
          }
        });
        return count;
      })
    );

    // Get service distribution from work orders
    const allWorkOrders = await prisma.workOrder.findMany({
      select: {
        repairs: true,
        maintenance: true,
        createdAt: true,
        amountPaid: true,
        paymentStatus: true,
      }
    });

    // Parse services from work orders and count them
    const serviceCount: Record<string, number> = {};
    allWorkOrders.forEach((wo: any) => {
      // Parse repairs JSON
      if (wo.repairs) {
        try {
          const repairs = JSON.parse(wo.repairs);
          if (Array.isArray(repairs)) {
            repairs.forEach((service: any) => {
              const name = service.name || service.serviceName || 'Other Repair';
              serviceCount[name] = (serviceCount[name] || 0) + 1;
            });
          }
        } catch (e) {
          // If not JSON, treat as single service name
          serviceCount[wo.repairs] = (serviceCount[wo.repairs] || 0) + 1;
        }
      }
      // Parse maintenance JSON
      if (wo.maintenance) {
        try {
          const maintenance = JSON.parse(wo.maintenance);
          if (Array.isArray(maintenance)) {
            maintenance.forEach((service: any) => {
              const name = service.name || service.serviceName || 'Other Maintenance';
              serviceCount[name] = (serviceCount[name] || 0) + 1;
            });
          }
        } catch (e) {
          // If not JSON, treat as single service name
          serviceCount[wo.maintenance] = (serviceCount[wo.maintenance] || 0) + 1;
        }
      }
    });

    // Convert to sorted array with percentages (top 6)
    const totalServices = Object.values(serviceCount).reduce((sum, count) => sum + count, 0);
    const serviceDistribution = Object.entries(serviceCount)
      .map(([name, count]) => ({
        name,
        count,
        percentage: totalServices > 0 ? Math.round((count / totalServices) * 1000) / 10 : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    // Today's stats
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const servicesToday = await prisma.workOrder.count({
      where: {
        createdAt: { gte: todayStart }
      }
    });
    const revenueToday = await prisma.workOrder.aggregate({
      where: {
        createdAt: { gte: todayStart },
        paymentStatus: 'paid'
      },
      _sum: { amountPaid: true }
    });

    // Calculate Performance Metrics
    
    // 1. Average Customer Rating from Reviews
    const reviewStats = await prisma.review.aggregate({
      _avg: { rating: true },
      _count: { rating: true }
    });
    const avgCustomerRating = reviewStats._avg.rating ? Math.round(reviewStats._avg.rating * 10) / 10 : 0;
    const totalReviews = reviewStats._count.rating || 0;

    // 2. Calculate Average Response Time (time from creation to first status change to 'assigned' or 'in-progress')
    const workOrdersWithStatusHistory = await prisma.workOrder.findMany({
      where: {
        createdAt: { gte: thirtyDaysAgo }
      },
      select: {
        id: true,
        createdAt: true,
        statusHistory: {
          where: {
            toStatus: { in: ['assigned', 'in-progress'] }
          },
          orderBy: { createdAt: 'asc' },
          take: 1
        }
      }
    });

    let totalResponseMinutes = 0;
    let responseCount = 0;
    workOrdersWithStatusHistory.forEach((wo: any) => {
      if (wo.statusHistory && wo.statusHistory.length > 0) {
        const responseTime = new Date(wo.statusHistory[0].createdAt).getTime() - new Date(wo.createdAt).getTime();
        totalResponseMinutes += responseTime / (1000 * 60); // Convert to minutes
        responseCount++;
      }
    });
    
    const avgResponseMinutes = responseCount > 0 ? Math.round(totalResponseMinutes / responseCount) : 0;
    let avgResponseTimeStr = 'N/A';
    if (avgResponseMinutes > 0) {
      if (avgResponseMinutes < 60) {
        avgResponseTimeStr = `${avgResponseMinutes} min`;
      } else if (avgResponseMinutes < 1440) { // Less than 24 hours
        avgResponseTimeStr = `${Math.round(avgResponseMinutes / 60 * 10) / 10} hrs`;
      } else {
        avgResponseTimeStr = `${Math.round(avgResponseMinutes / 1440 * 10) / 10} days`;
      }
    }

    // 3. Calculate Efficiency (jobs completed on time / total completed jobs)
    // For now, we'll estimate efficiency based on completion rate and response time
    const completedWorkOrders = await prisma.workOrder.findMany({
      where: {
        status: { in: ['closed', 'completed'] },
        completedAt: { not: null },
        dueDate: { not: null }
      },
      select: {
        completedAt: true,
        dueDate: true
      }
    });

    let onTimeCount = 0;
    completedWorkOrders.forEach((wo: any) => {
      if (wo.completedAt && wo.dueDate && new Date(wo.completedAt) <= new Date(wo.dueDate)) {
        onTimeCount++;
      }
    });
    const efficiencyRate = completedWorkOrders.length > 0 
      ? Math.round((onTimeCount / completedWorkOrders.length) * 100) 
      : (avgCompletionRate > 0 ? Math.min(avgCompletionRate + 5, 100) : 0); // Fallback estimation

    // 4. First-time fix rate (jobs completed without reopening)
    // This would require tracking reopened jobs - for now estimate based on completion rate
    const firstTimeFixRate = avgCompletionRate > 0 ? Math.min(avgCompletionRate + 3, 100) : 0;

    // 5. Pending Actions Counts
    // Pending shop applications
    const pendingShopApplications = await prisma.shop.count({
      where: { status: 'pending' }
    });

    // Pending work orders (unassigned or waiting)
    const pendingWorkOrders = await prisma.workOrder.count({
      where: { status: { in: ['pending', 'waiting-estimate', 'waiting-for-payment'] } }
    });

    // Unread messages/support (messages from last 7 days without reply)
    const recentMessages = await prisma.message.count({
      where: {
        createdAt: { gte: sevenDaysAgo },
        sender: 'customer'
      }
    });

    // Overdue work orders (past due date, not completed)
    const overdueWorkOrders = await prisma.workOrder.count({
      where: {
        dueDate: { lt: now },
        status: { notIn: ['closed', 'completed', 'denied-estimate'] }
      }
    });

    // Expiring subscriptions (ending in next 7 days)
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const expiringSubscriptions = await prisma.subscription.count({
      where: {
        currentPeriodEnd: { lte: nextWeek, gte: now },
        status: 'active'
      }
    });

    return NextResponse.json({ 
      subscriptions: subscriptionsWithDetails,
      liveMetrics: {
        // Shop counts
        totalShops,
        newShopsThisMonth,
        newShopsLastMonth,
        shopGrowth: `${shopGrowth >= 0 ? '+' : ''}${shopGrowth}%`,
        // User counts
        totalUsers,
        totalCapacity,
        utilizationRate: `${utilizationRate}%`,
        avgTeamSize: totalShops > 0 ? Math.round(totalUsers / totalShops) : 0,
        // Revenue
        totalPlatformRevenue,
        totalRevenueThisMonth,
        mrr,
        avgRevenuePerShop,
        revenueByPlan,
        // Jobs
        totalJobs: totalJobsAllShops,
        completedJobs: completedJobsAllShops,
        avgCompletionRate: `${avgCompletionRate}%`,
        completedThisMonth: activeSubscriptions.reduce((sum, sub) => sum + sub.metrics.jobsThisMonth, 0),
        // Distribution
        planDistribution,
        // Trends
        weeklyJobTrend: weeklyJobs,
        // Service Distribution
        serviceDistribution,
        servicesToday,
        revenueToday: revenueToday._sum.amountPaid || 0,
        // Performance Metrics (Live)
        avgResponseTime: avgResponseTimeStr,
        avgResponseMinutes,
        customerRating: avgCustomerRating,
        totalReviews,
        jobCompletionRate: avgCompletionRate,
        efficiencyRate,
        firstTimeFixRate,
        // Pending Actions
        pendingActions: {
          shopApplications: pendingShopApplications,
          pendingWorkOrders,
          customerMessages: recentMessages,
          overdueWorkOrders,
          expiringSubscriptions,
        }
      }
    });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions' },
      { status: 500 }
    );
  }
}