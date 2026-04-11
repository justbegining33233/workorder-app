'use client';

import React from 'react';
import KpiCard from './KpiCard';
import SalesFunnel from './SalesFunnel';
import SystemHealth from './SystemHealth';

interface PlatformStats {
  totalRevenue: string;
  totalShops: number;
  totalJobs: number;
  activeUsers: number;
  pendingShops: number;
  systemHealth: number;
  totalSubscriptions: number;
  newSubsThisMonth: number;
  monthlyRecurringRevenue: string;
}

interface WeeklyOverview {
  weekStart: string;
  weekEnd: string;
  newClientsByDay: number[];
  totalNewClientsThisWeek: number;
}

interface ThreeMonthAverages {
  avgNewClientsPerMonth: number;
  avgJobIncomePerMonth: string;
  avgSubscriptionRevenuePerMonth: string;
  churnRate: string;
  churnRateRaw?: number;
  totalClientsLast3Months: number;
  totalJobIncomeLast3Months: string;
}

interface LiveMetrics {
  revenueTrend: number[];
  revenueGrowth: string;
  subscriptionTrend: number[];
  retentionRate: string;
  retentionRateRaw: number;
  retentionChange: string;
  avgLifetimeMonths: number;
  avgRating: string;
  reviewsCount: number;
  websiteVisits: number;
  trialsCount: number;
  membersCount: number;
  convertedCustomersCount: number;
  totalShopsEver: number;
  trialSignups: number;
  activeTrials: number;
  convertedCustomers: number;
  conversionRate: string;
  revenueByPlan: Record<string, number>;
  totalMRR: number;
  annualRecurringRevenue: number;
  momGrowth: string;
  yoyGrowth: string;
  ltv: string;
  weeklyConversionTrend: { label: string; value: number }[];
}

interface DashboardTabProps {
  platformStats: PlatformStats;
  pendingShops: any[];
  approvedShops: any[];
  recentActivity: any[];
  planDistribution: Record<string, number>;
  weeklyOverview: WeeklyOverview;
  threeMonthAverages: ThreeMonthAverages;
  liveMetrics: LiveMetrics;
}

export function DashboardTab({
  platformStats,
  pendingShops,
  approvedShops,
  liveMetrics
}: DashboardTabProps) {
  const revenueTrend = liveMetrics.revenueTrend?.length ? liveMetrics.revenueTrend : [42, 52, 63, 58, 71, 69, 74];
  const subscriptionTrend = liveMetrics.subscriptionTrend?.length ? liveMetrics.subscriptionTrend : [12, 15, 17, 16, 18, 21, 25];

  const kpiCards = [
    {
      title: 'Monthly Recurring Revenue',
      value: liveMetrics.totalMRR ? `$${liveMetrics.totalMRR.toLocaleString()}` : platformStats.monthlyRecurringRevenue,
      change: liveMetrics.momGrowth || '+4.8% MoM',
      trend: revenueTrend,
      accent: 'emerald' as const,
      caption: 'Rolling 30-day MRR'
    },
    {
      title: 'Active Shops',
      value: platformStats.totalShops.toLocaleString(),
      change: '+2.1% WoW',
      trend: subscriptionTrend,
      accent: 'sky' as const,
      caption: 'Live storefronts'
    },
    {
      title: 'Active Users',
      value: platformStats.activeUsers.toLocaleString(),
      change: '+6.4% QoQ',
      trend: [8, 9, 12, 11, 13, 12, 14],
      accent: 'violet' as const,
      caption: 'Signed in last 24h'
    },
    {
      title: 'Pending Approvals',
      value: pendingShops.length.toString(),
      change: `${approvedShops.length} approved`,
      trend: [6, 8, 7, 9, 11, 10, 12],
      accent: 'amber' as const,
      caption: 'Ready for review'
    }
  ];

  const funnelData = {
    visits: liveMetrics.websiteVisits || liveMetrics.totalShopsEver || 0,
    trials: liveMetrics.trialsCount || liveMetrics.trialSignups || 0,
    members: liveMetrics.membersCount || liveMetrics.activeTrials || 0,
    customers: liveMetrics.convertedCustomersCount || liveMetrics.convertedCustomers || 0
  };

  const healthMetrics = [
    { label: 'API', value: `${platformStats.systemHealth}%`, subtext: 'Stable', tone: 'success' as const, trend: [68, 72, 75, 79, 82, 84, 86] },
    { label: 'Queue', value: '0.8s', subtext: 'Nominal', tone: 'info' as const, trend: [28, 26, 25, 23, 24, 22, 21] },
    { label: 'DB Latency', value: '142ms', subtext: 'Healthy', tone: 'success' as const, trend: [140, 138, 141, 142, 139, 137, 136] },
    { label: 'Errors', value: '0.03%', subtext: 'Low', tone: 'warning' as const, trend: [0.06, 0.05, 0.04, 0.03, 0.04, 0.03, 0.03] },
    { label: 'Uptime', value: '99.98%', subtext: 'Green', tone: 'success' as const, trend: [99.9, 99.92, 99.93, 99.95, 99.96, 99.97, 99.98] }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card) => (
          <KpiCard
            key={card.title}
            title={card.title}
            value={card.value}
            change={card.change}
            trend={card.trend}
            accent={card.accent}
            caption={card.caption}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SalesFunnel
          visits={funnelData.visits}
          trials={funnelData.trials}
          members={funnelData.members}
          customers={funnelData.customers}
        />
        <SystemHealth metrics={healthMetrics} />
      </div>
    </div>
  );
}
