import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/middleware';

// Subscription pricing for MRR/ARR calculations
const PLAN_PRICES: Record<string, number> = {
  starter: 99,
  growth: 199,
  professional: 349,
  business: 599,
  enterprise: 999
};

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  if (auth.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // ==================== REAL-TIME OPERATIONS ====================
    
    // Currently clocked in employees (have clocked in but not out)
    const clockedInEmployees = await prisma.timeEntry.findMany({
      where: {
        clockOut: null  // Only entries where user hasn't clocked out yet
      },
      include: {
        tech: {
          select: { 
            firstName: true, 
            lastName: true, 
            email: true,
            shop: {
              select: { shopName: true }
            }
          }
        }
      }
    });

    // Active work orders by status
    const workOrdersByStatus = await prisma.workOrder.groupBy({
      by: ['status'],
      _count: { id: true }
    });

    // Work orders created today
    const todayWorkOrders = await prisma.workOrder.count({
      where: { createdAt: { gte: todayStart } }
    });

    // Overdue work orders (past due date, not completed)
    const overdueWorkOrders = await prisma.workOrder.count({
      where: {
        dueDate: { lt: now },
        status: { notIn: ['completed', 'cancelled'] }
      }
    });

    // ==================== SUBSCRIPTION HEALTH ====================

    // Active subscriptions by plan
    const subscriptionsByPlan = await prisma.subscription.groupBy({
      by: ['plan'],
      where: { status: { in: ['active', 'trialing'] } },
      _count: { id: true }
    });

    // Trials expiring in 7 days
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const expiringTrials = await prisma.subscription.findMany({
      where: {
        status: 'trialing',
        trialEnd: { gte: now, lte: sevenDaysFromNow }
      },
      include: {
        shop: { select: { shopName: true, email: true } }
      }
    });

    // Past due subscriptions
    const pastDueSubscriptions = await prisma.subscription.findMany({
      where: {
        status: 'past_due'
      },
      include: {
        shop: { select: { shopName: true, email: true } }
      }
    });

    // Cancelled this month
    const cancelledThisMonth = await prisma.subscription.count({
      where: {
        canceledAt: { gte: monthAgo }
      }
    });

    // ==================== FINANCIAL METRICS ====================

    // Today's revenue
    const todayPayments = await prisma.workOrder.aggregate({
      where: {
        paymentStatus: 'paid',
        updatedAt: { gte: todayStart }
      },
      _sum: { amountPaid: true }
    });

    // This week's revenue
    const weekRevenue = await prisma.workOrder.aggregate({
      where: {
        paymentStatus: 'paid',
        updatedAt: { gte: weekAgo }
      },
      _sum: { amountPaid: true }
    });

    // Pending payments
    const pendingPayments = await prisma.workOrder.aggregate({
      where: {
        paymentStatus: 'pending',
        status: 'completed'
      },
      _sum: { estimatedCost: true },
      _count: { id: true }
    });

    // ==================== SHOP HEALTH ====================

    // Pending shop approvals
    const pendingShops = await prisma.shop.findMany({
      where: { status: 'pending' },
      select: {
        id: true,
        shopName: true,
        ownerName: true,
        email: true,
        createdAt: true,
        shopType: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Active shops (with activity in last 7 days)
    const activeShopIds = await prisma.workOrder.groupBy({
      by: ['shopId'],
      where: { createdAt: { gte: weekAgo } }
    });

    const totalApprovedShops = await prisma.shop.count({
      where: { status: 'approved' }
    });

    // Inactive shops (no activity in 30 days)
    const shopsWithRecentActivity = await prisma.workOrder.groupBy({
      by: ['shopId'],
      where: { createdAt: { gte: monthAgo } }
    });
    const activeShopIdsSet = new Set(shopsWithRecentActivity.map(s => s.shopId));
    
    const inactiveShops = await prisma.shop.findMany({
      where: {
        status: 'approved',
        id: { notIn: Array.from(activeShopIdsSet).filter((id): id is string => id !== null) }
      },
      select: {
        id: true,
        shopName: true,
        email: true,
        updatedAt: true
      },
      take: 10
    });

    // ==================== CUSTOMER METRICS ====================

    // New customers today
    const newCustomersToday = await prisma.customer.count({
      where: { createdAt: { gte: todayStart } }
    });

    // New customers this week
    const newCustomersWeek = await prisma.customer.count({
      where: { createdAt: { gte: weekAgo } }
    });

    // Total customers
    const totalCustomers = await prisma.customer.count();

    // ==================== REVIEWS & RATINGS ====================

    const reviewStats = await prisma.review.aggregate({
      _avg: { rating: true },
      _count: { id: true }
    });

    const recentBadReviews = await prisma.review.findMany({
      where: {
        rating: { lte: 2 },
        createdAt: { gte: weekAgo }
      },
      include: {
        shop: { select: { shopName: true } },
        customer: { select: { firstName: true, lastName: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    // ==================== COMMUNICATION ====================

    // Unread direct messages to admin
    const unreadAdminMessages = await prisma.directMessage.count({
      where: {
        receiverRole: 'admin',
        isRead: false
      }
    });

    // Total messages today
    const messagesToday = await prisma.directMessage.count({
      where: { createdAt: { gte: todayStart } }
    });

    // ==================== INVENTORY ALERTS ====================

    let lowStockItems: any[] = [];
    try {
      // Get items where quantity is at or below reorder point
      const allStock = await prisma.inventoryStock.findMany({
        take: 100
      });
      lowStockItems = allStock.filter(item => item.quantity <= (item.reorderPoint || 0));
    } catch (e) {
      // Inventory might not be set up
      console.log('Inventory query skipped:', e);
    }

    // ==================== TIME & ATTENDANCE ====================

    // Total hours worked today (platform-wide)
    const todayTimeEntries = await prisma.timeEntry.findMany({
      where: {
        clockIn: { gte: todayStart }
      }
    });

    let totalHoursToday = 0;
    todayTimeEntries.forEach(entry => {
      if (entry.clockIn && entry.clockOut) {
        const hours = (entry.clockOut.getTime() - entry.clockIn.getTime()) / (1000 * 60 * 60);
        totalHoursToday += hours;
      } else if (entry.clockIn && !entry.clockOut) {
        const hours = (now.getTime() - entry.clockIn.getTime()) / (1000 * 60 * 60);
        totalHoursToday += hours;
      }
    });

    // ==================== TECH METRICS ====================

    const totalTechs = await prisma.tech.count();
    const activeTechsToday = await prisma.timeEntry.groupBy({
      by: ['techId'],
      where: { clockIn: { gte: todayStart } }
    });

    // ==================== APPOINTMENTS ====================

    const todayAppointments = await prisma.appointment.count({
      where: {
        scheduledDate: {
          gte: todayStart,
          lt: new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)
        }
      }
    });

    const noShowsThisWeek = await prisma.appointment.count({
      where: {
        status: 'no-show',
        scheduledDate: { gte: weekAgo }
      }
    });

    // ==================== SERVICE BREAKDOWN ====================

    const serviceLocationBreakdown = await prisma.workOrder.groupBy({
      by: ['serviceLocation'],
      _count: { id: true }
    });

    // ==================== APP BUSINESS METRICS (MRR/ARR) ====================
    
    // Get all active subscriptions for MRR calculation
    const activeSubscriptions = await prisma.subscription.findMany({
      where: { status: { in: ['active', 'trialing'] } },
      include: { shop: { select: { shopName: true, email: true, createdAt: true } } }
    });

    // Calculate MRR (Monthly Recurring Revenue)
    let mrr = 0;
    const revenueByPlan: Record<string, { count: number; revenue: number }> = {};
    
    activeSubscriptions.forEach(sub => {
      const price = PLAN_PRICES[sub.plan] || 0;
      mrr += price;
      if (!revenueByPlan[sub.plan]) {
        revenueByPlan[sub.plan] = { count: 0, revenue: 0 };
      }
      revenueByPlan[sub.plan].count++;
      revenueByPlan[sub.plan].revenue += price;
    });

    // ARR (Annual Recurring Revenue)
    const arr = mrr * 12;

    // New subscriptions this month
    const newSubsThisMonth = await prisma.subscription.count({
      where: { createdAt: { gte: monthAgo } }
    });

    // New subscriptions last month (for growth comparison)
    const newSubsLastMonth = await prisma.subscription.count({
      where: { 
        createdAt: { 
          gte: twoMonthsAgo,
          lt: monthAgo 
        } 
      }
    });

    // Calculate MoM growth
    const momGrowth = newSubsLastMonth > 0 
      ? ((newSubsThisMonth - newSubsLastMonth) / newSubsLastMonth) * 100 
      : newSubsThisMonth > 0 ? 100 : 0;

    // Churn rate (cancelled this month / total active at start of month)
    const churnRate = activeSubscriptions.length > 0 
      ? (cancelledThisMonth / (activeSubscriptions.length + cancelledThisMonth)) * 100 
      : 0;

    // Retention rate
    const retentionRate = 100 - churnRate;

    // Total shops ever created
    const totalShopsCreated = await prisma.shop.count();
    
    // Shops by status
    const shopsByStatus = await prisma.shop.groupBy({
      by: ['status'],
      _count: { id: true }
    });

    // ==================== COMPILE RESPONSE ====================

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      
      realTimeOps: {
        clockedInNow: clockedInEmployees.length,
        clockedInDetails: clockedInEmployees.map(e => ({
          name: `${e.tech?.firstName} ${e.tech?.lastName}`,
          shop: e.tech?.shop?.shopName || 'Unknown Shop',
          since: e.clockIn,
          onBreak: e.breakStart && !e.breakEnd
        })),
        activeWorkOrders: workOrdersByStatus.reduce((acc, s) => {
          if (s.status && !['completed', 'cancelled'].includes(s.status)) {
            acc += s._count.id;
          }
          return acc;
        }, 0),
        workOrdersByStatus: workOrdersByStatus.reduce((acc, s) => {
          acc[s.status || 'unknown'] = s._count.id;
          return acc;
        }, {} as Record<string, number>),
        todayWorkOrders,
        overdueWorkOrders,
        todayAppointments,
        noShowsThisWeek
      },

      subscriptionHealth: {
        byPlan: subscriptionsByPlan.reduce((acc, s) => {
          acc[s.plan] = s._count.id;
          return acc;
        }, {} as Record<string, number>),
        expiringTrials: expiringTrials.map(t => ({
          shop: t.shop?.shopName,
          email: t.shop?.email,
          expiresAt: t.trialEnd
        })),
        pastDue: pastDueSubscriptions.map(s => ({
          shop: s.shop?.shopName,
          email: s.shop?.email,
          plan: s.plan
        })),
        cancelledThisMonth,
        totalActive: subscriptionsByPlan.reduce((acc, s) => acc + s._count.id, 0)
      },

      financials: {
        todayRevenue: todayPayments._sum.amountPaid || 0,
        weekRevenue: weekRevenue._sum.amountPaid || 0,
        pendingPayments: {
          count: pendingPayments._count.id,
          amount: pendingPayments._sum.estimatedCost || 0
        }
      },

      shopHealth: {
        pendingApproval: pendingShops.length,
        pendingShops,
        totalApproved: totalApprovedShops,
        activeThisWeek: activeShopIds.length,
        inactiveShops: inactiveShops.length,
        inactiveList: inactiveShops
      },

      customers: {
        total: totalCustomers,
        newToday: newCustomersToday,
        newThisWeek: newCustomersWeek
      },

      reviews: {
        averageRating: Math.round((reviewStats._avg.rating || 0) * 10) / 10,
        totalReviews: reviewStats._count.id,
        recentBadReviews: recentBadReviews.map(r => ({
          shop: r.shop?.shopName,
          customer: `${r.customer?.firstName} ${r.customer?.lastName}`,
          rating: r.rating,
          comment: r.comment,
          date: r.createdAt
        }))
      },

      communication: {
        unreadAdminMessages,
        messagesToday
      },

      inventory: {
        lowStockAlerts: lowStockItems.length,
        lowStockItems: lowStockItems.map(i => ({
          item: i.name,
          shop: i.shop?.shopName,
          quantity: i.quantity,
          reorderPoint: i.reorderPoint
        }))
      },

      workforce: {
        totalTechs,
        activeTechsToday: activeTechsToday.length,
        totalHoursToday: Math.round(totalHoursToday * 10) / 10
      },

      serviceBreakdown: serviceLocationBreakdown.reduce((acc, s) => {
        acc[s.serviceLocation || 'unknown'] = s._count.id;
        return acc;
      }, {} as Record<string, number>),

      // ==================== APP BUSINESS METRICS ====================
      businessMetrics: {
        // Revenue
        mrr,
        arr,
        revenueByPlan,
        
        // Growth
        newSubsThisMonth,
        newSubsLastMonth,
        momGrowth: Math.round(momGrowth * 10) / 10,
        
        // Retention
        churnRate: Math.round(churnRate * 10) / 10,
        retentionRate: Math.round(retentionRate * 10) / 10,
        
        // Shops
        totalShopsCreated,
        shopsByStatus: shopsByStatus.reduce((acc, s) => {
          acc[s.status] = s._count.id;
          return acc;
        }, {} as Record<string, number>),
        
        // Active subscriptions breakdown
        totalActiveSubscriptions: activeSubscriptions.length,
        subscriptionsList: activeSubscriptions.map(s => ({
          shop: s.shop?.shopName,
          email: s.shop?.email,
          plan: s.plan,
          status: s.status,
          startDate: s.currentPeriodStart,
          monthlyRevenue: PLAN_PRICES[s.plan] || 0
        }))
      }
    });

  } catch (error) {
    console.error('Command Center API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch command center data', details: String(error) },
      { status: 500 }
    );
  }
}
