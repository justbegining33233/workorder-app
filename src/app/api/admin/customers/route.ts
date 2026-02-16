'use server';

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Get date ranges
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Fetch all approved shops (customers) with comprehensive data
    const customers: any[] = await prisma.shop.findMany({
      where: {
        status: 'approved'
      },
      orderBy: { createdAt: 'desc' },
      include: {
        workOrders: {
          select: {
            id: true,
            status: true,
            amountPaid: true,
            paymentStatus: true,
            createdAt: true,
            completedAt: true,
          }
        },
        techs: {
          select: { id: true, available: true, firstName: true, lastName: true, role: true }
        },
        subscription: {
          select: {
            id: true,
            plan: true,
            status: true,
            trialStart: true,
            trialEnd: true,
            currentPeriodStart: true,
            currentPeriodEnd: true,
            stripeCustomerId: true,
            stripeSubscriptionId: true,
          }
        },
        reviews: {
          select: { rating: true }
        },
        inventory: {
          select: { id: true, quantity: true }
        }
      }
    });

    // Plan pricing
    const planPricing: Record<string, number> = {
      starter: 29,
      growth: 79,
      professional: 149,
      business: 249,
      enterprise: 499,
    };

    // Process customer data with live metrics
    const formattedCustomers = customers.map((customer: any) => {
      const completedJobs = customer.workOrders.filter((wo: any) => wo.status === 'closed' || wo.status === 'completed').length;
      const totalJobs = customer.workOrders.length;
      const totalRevenue = customer.workOrders
        .filter((wo: any) => wo.paymentStatus === 'paid')
        .reduce((sum: number, wo: any) => sum + (wo.amountPaid || 0), 0);
      
      // Monthly revenue
      const revenueThisMonth = customer.workOrders
        .filter((wo: any) => wo.paymentStatus === 'paid' && new Date(wo.createdAt) >= startOfMonth)
        .reduce((sum: number, wo: any) => sum + (wo.amountPaid || 0), 0);
      
      const revenueLastMonth = customer.workOrders
        .filter((wo: any) => wo.paymentStatus === 'paid' && new Date(wo.createdAt) >= startOfLastMonth && new Date(wo.createdAt) <= endOfLastMonth)
        .reduce((sum: number, wo: any) => sum + (wo.amountPaid || 0), 0);

      // Jobs metrics
      const jobsThisMonth = customer.workOrders.filter((wo: any) => new Date(wo.createdAt) >= startOfMonth).length;
      const jobsLastMonth = customer.workOrders.filter((wo: any) => 
        new Date(wo.createdAt) >= startOfLastMonth && new Date(wo.createdAt) <= endOfLastMonth
      ).length;

      // Average rating
      const avgRating = customer.reviews.length > 0 
        ? customer.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / customer.reviews.length 
        : 0;

      // Completion rate
      const completionRate = totalJobs > 0 ? Math.round((completedJobs / totalJobs) * 100) : 0;

      // Team members (using status field)
      const teamMembers = customer.techs.length;
      const activeTeamMembers = customer.techs.filter((t: any) => t.status === 'active').length;
      const managers = customer.techs.filter((t: any) => t.role === 'manager').length;

      // Subscription info
      const sub = customer.subscription;
      const plan = sub?.plan || 'free';
      const monthlyFee = planPricing[plan.toLowerCase()] || 0;
      const isTrialing = sub?.status === 'trialing';
      const isActive = sub?.status === 'active';
      const trialDaysLeft = isTrialing && sub?.trialEnd 
        ? Math.max(0, Math.ceil((new Date(sub.trialEnd).getTime() - now.getTime()) / (24 * 60 * 60 * 1000)))
        : 0;

      // Customer lifetime (months since created)
      const lifetimeMonths = Math.max(1, Math.round((now.getTime() - new Date(customer.createdAt).getTime()) / (30 * 24 * 60 * 60 * 1000)));

      // Customer health score (0-100)
      const activityScore = Math.min(100, (jobsThisMonth * 10));
      const engagementScore = Math.min(100, (teamMembers * 20));
      const revenueScore = Math.min(100, (revenueThisMonth / 1000) * 10);
      const healthScore = Math.round((activityScore + engagementScore + revenueScore) / 3);

      // Inventory count
      const inventoryItems = customer.inventory.length;
      const totalInventoryValue = customer.inventory.reduce((sum: number, i: any) => sum + i.quantity, 0);

      return {
        id: customer.id,
        name: customer.shopName,
        ownerName: customer.ownerName || 'N/A',
        email: customer.email,
        phone: customer.phone,
        location: customer.city && customer.state ? `${customer.city}, ${customer.state}` : customer.address || 'N/A',
        address: customer.address,
        city: customer.city,
        state: customer.state,
        zipCode: customer.zipCode,
        shopType: customer.shopType || 'general',
        profileComplete: customer.profileComplete,
        createdAt: customer.createdAt,
        approvedAt: customer.approvedAt,
        // Live business metrics
        totalJobs,
        completedJobs,
        completionRate,
        totalRevenue,
        revenueThisMonth,
        revenueLastMonth,
        jobsThisMonth,
        jobsLastMonth,
        rating: Math.round(avgRating * 10) / 10,
        reviewCount: customer.reviews.length,
        // Team
        teamMembers,
        activeTeamMembers,
        managers,
        // Health
        healthScore,
        lifetimeMonths,
        // Inventory
        inventoryItems,
        totalInventoryValue,
        // Subscription
        subscription: sub ? {
          id: sub.id,
          plan: sub.plan,
          status: sub.status,
          isTrialing,
          isActive,
          trialDaysLeft,
          monthlyFee,
          currentPeriodStart: sub.currentPeriodStart,
          currentPeriodEnd: sub.currentPeriodEnd,
          hasStripe: !!sub.stripeCustomerId,
        } : null
      };
    });

    // Aggregate metrics
    const totalCustomers = customers.length;
    
    // New customers
    const newCustomersThisMonth = customers.filter((c: any) => new Date(c.createdAt) >= startOfMonth).length;
    const newCustomersLastMonth = customers.filter((c: any) => 
      new Date(c.createdAt) >= startOfLastMonth && new Date(c.createdAt) <= endOfLastMonth
    ).length;
    const customerGrowth = newCustomersLastMonth > 0 
      ? Math.round(((newCustomersThisMonth - newCustomersLastMonth) / newCustomersLastMonth) * 100)
      : newCustomersThisMonth > 0 ? 100 : 0;

    // Churn calculation (customers who cancelled in last 30 days)
    const cancelledCustomers = customers.filter((c: any) => 
      c.subscription?.status === 'cancelled' || c.subscription?.status === 'canceled'
    ).length;
    const churnRate = totalCustomers > 0 ? Math.round((cancelledCustomers / totalCustomers) * 100) : 0;
    const retentionRate = 100 - churnRate;

    // MRR calculation
    const mrr = formattedCustomers
      .filter((c: any) => c.subscription?.isActive)
      .reduce((sum: number, c: any) => sum + (c.subscription?.monthlyFee || 0), 0);
    
    const arr = mrr * 12;

    // ARPU (Average Revenue Per User)
    const arpu = totalCustomers > 0 ? Math.round(mrr / totalCustomers) : 0;

    // Customer lifetime value (LTV)
    const avgLifetimeMonths = formattedCustomers.length > 0
      ? formattedCustomers.reduce((sum: number, c: any) => sum + c.lifetimeMonths, 0) / formattedCustomers.length
      : 0;
    const ltv = Math.round(arpu * avgLifetimeMonths);

    // Revenue from work orders
    const totalWorkOrderRevenue = formattedCustomers.reduce((sum: number, c: any) => sum + c.totalRevenue, 0);
    const workOrderRevenueThisMonth = formattedCustomers.reduce((sum: number, c: any) => sum + c.revenueThisMonth, 0);
    const workOrderRevenueLastMonth = formattedCustomers.reduce((sum: number, c: any) => sum + c.revenueLastMonth, 0);

    // Jobs metrics
    const totalJobs = formattedCustomers.reduce((sum: number, c: any) => sum + c.totalJobs, 0);
    const totalJobsThisMonth = formattedCustomers.reduce((sum: number, c: any) => sum + c.jobsThisMonth, 0);
    const totalJobsLastMonth = formattedCustomers.reduce((sum: number, c: any) => sum + c.jobsLastMonth, 0);
    const jobsGrowth = totalJobsLastMonth > 0
      ? Math.round(((totalJobsThisMonth - totalJobsLastMonth) / totalJobsLastMonth) * 100)
      : totalJobsThisMonth > 0 ? 100 : 0;

    // Plan distribution
    const planDistribution: Record<string, number> = {
      starter: 0,
      growth: 0,
      professional: 0,
      business: 0,
      enterprise: 0,
      free: 0,
    };
    formattedCustomers.forEach((c: any) => {
      const plan = c.subscription?.plan?.toLowerCase() || 'free';
      if (planDistribution[plan] !== undefined) {
        planDistribution[plan]++;
      } else {
        planDistribution.free++;
      }
    });

    // Health distribution
    const healthDistribution = {
      excellent: formattedCustomers.filter((c: any) => c.healthScore >= 80).length,
      good: formattedCustomers.filter((c: any) => c.healthScore >= 60 && c.healthScore < 80).length,
      fair: formattedCustomers.filter((c: any) => c.healthScore >= 40 && c.healthScore < 60).length,
      poor: formattedCustomers.filter((c: any) => c.healthScore < 40).length,
    };

    // Top customers by revenue
    const topCustomers = [...formattedCustomers]
      .sort((a: any, b: any) => b.totalRevenue - a.totalRevenue)
      .slice(0, 5);

    // At-risk customers (low health score or trialing about to expire)
    const atRiskCustomers = formattedCustomers
      .filter((c: any) => c.healthScore < 40 || (c.subscription?.isTrialing && (c.subscription?.trialDaysLeft || 0) <= 3))
      .slice(0, 5);

    // 7-day customer trend
    const customerTrend: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const count = customers.filter((c: any) => {
        const created = new Date(c.createdAt);
        return created >= date && created < nextDate;
      }).length;
      customerTrend.push(count);
    }

    // 7-day revenue trend (from work orders)
    const revenueTrend: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      let dayRevenue = 0;
      customers.forEach(c => {
        c.workOrders.forEach((wo: any) => {
          if (wo.paymentStatus === 'paid') {
            const woDate = new Date(wo.createdAt);
            if (woDate >= date && woDate < nextDate) {
              dayRevenue += wo.amountPaid || 0;
            }
          }
        });
      });
      revenueTrend.push(dayRevenue);
    }

    return NextResponse.json({
      success: true,
      customers: formattedCustomers,
      liveMetrics: {
        // Customer counts
        totalCustomers,
        newCustomersThisMonth,
        newCustomersLastMonth,
        customerGrowth: `${customerGrowth >= 0 ? '+' : ''}${customerGrowth}%`,
        // Subscription metrics
        mrr,
        arr,
        arpu,
        ltv,
        avgLifetimeMonths: Math.round(avgLifetimeMonths),
        churnRate: `${churnRate}%`,
        retentionRate: `${retentionRate}%`,
        // Work order revenue
        totalWorkOrderRevenue,
        workOrderRevenueThisMonth,
        workOrderRevenueLastMonth,
        // Jobs
        totalJobs,
        totalJobsThisMonth,
        totalJobsLastMonth,
        jobsGrowth: `${jobsGrowth >= 0 ? '+' : ''}${jobsGrowth}%`,
        // Distributions
        planDistribution,
        healthDistribution,
        // Lists
        topCustomers,
        atRiskCustomers,
        // Trends
        customerTrend,
        revenueTrend,
      }
    });
  } catch (error) {
    console.error('Error fetching admin customers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch customers data' },
      { status: 500 }
    );
  }
}
