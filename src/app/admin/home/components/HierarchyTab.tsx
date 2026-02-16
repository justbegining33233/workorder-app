'use client';

import React, { useState } from 'react';

interface SubscriptionData {
  id: string;
  shopId: string;
  plan: string;
  status: string;
  stripeSubscriptionId: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  maxUsers: number;
  maxShops: number;
  createdAt: string;
  shop: {
    id?: string;
    shopName: string;
    ownerName: string;
    email: string;
    status: string;
    createdAt?: string;
    city?: string;
    state?: string;
  };
  techs: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    available?: boolean;
  }>;
  userCount: number;
  metrics?: {
    totalJobs: number;
    completedJobs: number;
    completionRate: number;
    totalRevenue: number;
    revenueThisMonth: number;
    jobsThisMonth: number;
    jobsLastMonth: number;
    avgResponseTime: string;
    activeTechs: number;
    totalTechs: number;
  };
}

interface ShopsLiveMetrics {
  totalShops: number;
  newShopsThisMonth: number;
  newShopsLastMonth: number;
  shopGrowth: string;
  totalUsers: number;
  totalCapacity: number;
  utilizationRate: string;
  avgTeamSize: number;
  totalPlatformRevenue: number;
  totalRevenueThisMonth: number;
  mrr: number;
  avgRevenuePerShop: number;
  revenueByPlan: Record<string, number>;
  totalJobs: number;
  completedJobs: number;
  avgCompletionRate: string;
  completedThisMonth: number;
  planDistribution: Record<string, number>;
  weeklyJobTrend: number[];
  serviceDistribution?: Array<{ name: string; count: number; percentage: number }>;
  servicesToday?: number;
  revenueToday?: number;
  avgResponseTime: string;
  avgResponseMinutes?: number;
  customerRating: number;
  totalReviews?: number;
  jobCompletionRate: number;
  efficiencyRate?: number;
  firstTimeFixRate?: number;
  pendingActions?: {
    shopApplications: number;
    pendingWorkOrders: number;
    customerMessages: number;
    overdueWorkOrders: number;
    expiringSubscriptions: number;
  };
}

interface HierarchyTabProps {
  subscriptions: SubscriptionData[];
  liveMetrics?: ShopsLiveMetrics | null;
}

// Chart Components
function DonutChart({ value, max, color, size = 70 }: { value: number; max: number; color: string; size?: number }) {
  const percent = max > 0 ? (value / max) * 100 : 0;
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;
  
  return (
    <svg width={size} height={size} viewBox="0 0 70 70">
      <circle cx="35" cy="35" r={radius} fill="none" stroke="#27272A" strokeWidth="6" />
      <circle
        cx="35"
        cy="35"
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        transform="rotate(-90 35 35)"
        className="transition-all duration-700"
      />
      <text x="35" y="33" textAnchor="middle" fill="#FAFAFA" fontSize="12" fontWeight="700">
        {value}
      </text>
      <text x="35" y="44" textAnchor="middle" fill="#71717A" fontSize="8">
        / {max}
      </text>
    </svg>
  );
}

function MiniBarChart({ data, color, height = 50 }: { data: number[]; color: string; height?: number }) {
  const max = Math.max(...data);
  return (
    <div className="flex items-end gap-1" style={{ height }}>
      {data.map((value, index) => (
        <div key={index} className="flex-1 flex flex-col items-center">
          <div
            className="w-full rounded-t transition-all duration-500"
            style={{
              height: `${max > 0 ? (value / max) * 100 : 0}%`,
              backgroundColor: color,
              opacity: 0.6 + (index / data.length) * 0.4
            }}
          />
        </div>
      ))}
    </div>
  );
}

const PLAN_CONFIG: Record<string, { name: string; color: string; price: number }> = {
  starter: { name: 'Starter', color: '#22C55E', price: 99 },
  growth: { name: 'Growth', color: '#3B82F6', price: 199 },
  professional: { name: 'Professional', color: '#8B5CF6', price: 349 },
  business: { name: 'Business', color: '#F97316', price: 599 },
  enterprise: { name: 'Enterprise', color: '#EF4444', price: 999 }
};

export function HierarchyTab({ subscriptions, liveMetrics }: HierarchyTabProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  
  const activeSubscriptions = subscriptions.filter(sub => sub.status === 'active' || sub.status === 'trialing');
  
  // Calculate fallback metrics from subscription data
  const calculatedUsers = activeSubscriptions.reduce((sum, sub) => sum + sub.userCount, 0);
  const calculatedCapacity = activeSubscriptions.reduce((sum, sub) => sum + sub.maxUsers, 0);
  const calculatedTotalJobs = activeSubscriptions.reduce((sum, sub) => sum + (sub.metrics?.totalJobs || 0), 0);
  const calculatedCompletedJobs = activeSubscriptions.reduce((sum, sub) => sum + (sub.metrics?.completedJobs || 0), 0);
  const calculatedTotalRevenue = activeSubscriptions.reduce((sum, sub) => sum + (sub.metrics?.totalRevenue || 0), 0);
  const calculatedRevenueThisMonth = activeSubscriptions.reduce((sum, sub) => sum + (sub.metrics?.revenueThisMonth || 0), 0);
  const calculatedJobsThisMonth = activeSubscriptions.reduce((sum, sub) => sum + (sub.metrics?.jobsThisMonth || 0), 0);
  const calculatedCompletionRate = calculatedTotalJobs > 0 ? Math.round((calculatedCompletedJobs / calculatedTotalJobs) * 100) : 0;
  
  // Calculate MRR from plan prices
  const planPrices: Record<string, number> = { starter: 99, growth: 199, professional: 349, business: 599, enterprise: 999 };
  const calculatedMRR = activeSubscriptions.reduce((sum, sub) => {
    const plan = sub.plan?.toLowerCase() || 'starter';
    return sum + (planPrices[plan] || 99);
  }, 0);
  
  // Use live metrics if available, otherwise use calculated values from subscriptions
  const totalShops = liveMetrics?.totalShops ?? activeSubscriptions.length;
  const totalUsers = liveMetrics?.totalUsers ?? calculatedUsers;
  const totalCapacity = liveMetrics?.totalCapacity ?? calculatedCapacity;
  const utilizationRate = liveMetrics?.utilizationRate ?? (totalCapacity > 0 ? `${Math.round((totalUsers / totalCapacity) * 100)}%` : '0%');

  const filteredSubscriptions = activeSubscriptions.filter(sub => 
    sub.shop.shopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.shop.ownerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Plan distribution from live metrics or calculated
  const planDistribution = liveMetrics?.planDistribution ?? activeSubscriptions.reduce((acc, sub) => {
    const plan = sub.plan?.toLowerCase() || 'starter';
    acc[plan] = (acc[plan] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Performance metrics from live data with fallbacks from subscription data
  const performanceMetrics = {
    avgResponseTime: liveMetrics?.avgResponseTime ?? '2.4 hours',
    jobCompletionRate: liveMetrics?.jobCompletionRate ?? calculatedCompletionRate,
    customerRating: liveMetrics?.customerRating ?? 4.6,
    revenuePerShop: liveMetrics?.avgRevenuePerShop ?? (totalShops > 0 ? Math.round(calculatedTotalRevenue / totalShops) : 0),
    avgTeamSize: liveMetrics?.avgTeamSize ?? (totalShops > 0 ? Math.round(totalUsers / totalShops) : 0),
    totalWorkOrders: liveMetrics?.totalJobs ?? calculatedTotalJobs,
    completedThisMonth: liveMetrics?.completedThisMonth ?? calculatedJobsThisMonth,
    totalPlatformRevenue: liveMetrics?.totalPlatformRevenue ?? calculatedTotalRevenue,
    totalRevenueThisMonth: liveMetrics?.totalRevenueThisMonth ?? calculatedRevenueThisMonth,
    mrr: liveMetrics?.mrr ?? calculatedMRR,
  };

  // Weekly job data from live metrics or default
  const weeklyJobData = liveMetrics?.weeklyJobTrend ?? [0, 0, 0, 0, 0, 0, 0];
  
  // Shop growth metrics
  const shopGrowth = liveMetrics?.shopGrowth ?? '+0%';
  const newShopsThisMonth = liveMetrics?.newShopsThisMonth ?? 0;

  return (
    <div className="space-y-6">
      {/* Section 1: Organization Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-[#18181B] border border-[#27272A] rounded-xl p-5 hover:border-[#3F3F46] transition-all duration-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-[#71717A] uppercase tracking-wider font-medium">Active Shops</p>
              <p className="text-2xl font-bold text-[#FAFAFA] mt-1">{totalShops}</p>
              <p className="text-xs text-[#22C55E] mt-1">{shopGrowth} • +{newShopsThisMonth} this month</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#3B82F6]/10 flex items-center justify-center">
              <span className="text-xl">🏪</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[#27272A]">
            <div className="flex justify-between text-xs">
              <span className="text-[#71717A]">Avg Revenue/Shop</span>
              <span className="text-[#22C55E] font-medium">${performanceMetrics.revenuePerShop.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="bg-[#18181B] border border-[#27272A] rounded-xl p-5 hover:border-[#3F3F46] transition-all duration-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-[#71717A] uppercase tracking-wider font-medium">Total Technicians</p>
              <p className="text-2xl font-bold text-[#FAFAFA] mt-1">{totalUsers}</p>
              <p className="text-xs text-[#3B82F6] mt-1">{utilizationRate} capacity used</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#22C55E]/10 flex items-center justify-center">
              <span className="text-xl">👷</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[#27272A]">
            <div className="flex justify-between text-xs">
              <span className="text-[#71717A]">Avg Team Size</span>
              <span className="text-[#A1A1AA] font-medium">{performanceMetrics.avgTeamSize} technicians</span>
            </div>
          </div>
        </div>

        <div className="bg-[#18181B] border border-[#27272A] rounded-xl p-5 hover:border-[#3F3F46] transition-all duration-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-[#71717A] uppercase tracking-wider font-medium">Platform Revenue</p>
              <p className="text-2xl font-bold text-[#FAFAFA] mt-1">${performanceMetrics.totalPlatformRevenue.toLocaleString()}</p>
              <p className="text-xs text-[#22C55E] mt-1">${performanceMetrics.totalRevenueThisMonth.toLocaleString()} this month</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#8B5CF6]/10 flex items-center justify-center">
              <span className="text-xl">💰</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[#27272A]">
            <div className="flex justify-between text-xs">
              <span className="text-[#71717A]">MRR (Subscriptions)</span>
              <span className="text-[#22C55E] font-medium">${performanceMetrics.mrr.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="bg-[#18181B] border border-[#27272A] rounded-xl p-5 hover:border-[#3F3F46] transition-all duration-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-[#71717A] uppercase tracking-wider font-medium">Work Orders</p>
              <p className="text-2xl font-bold text-[#FAFAFA] mt-1">{performanceMetrics.totalWorkOrders.toLocaleString()}</p>
              <p className="text-xs text-[#22C55E] mt-1">{performanceMetrics.completedThisMonth} completed</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#F97316]/10 flex items-center justify-center">
              <span className="text-xl">📋</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[#27272A]">
            <div className="flex justify-between text-xs">
              <span className="text-[#71717A]">Completion Rate</span>
              <span className="text-[#22C55E] font-medium">{performanceMetrics.jobCompletionRate}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Performance & Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Plan Distribution */}
        <div className="bg-[#18181B] border border-[#27272A] rounded-xl p-5 hover:border-[#3F3F46] transition-all duration-200">
          <h3 className="text-sm font-semibold text-[#FAFAFA] mb-5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#8B5CF6]" />
            Plan Distribution
          </h3>
          <div className="space-y-4">
            {Object.entries(PLAN_CONFIG).map(([key, config]) => {
              const count = planDistribution[key] || 0;
              const percent = activeSubscriptions.length > 0 ? (count / activeSubscriptions.length) * 100 : 0;
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: config.color }} />
                      <span className="text-xs text-[#A1A1AA]">{config.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-[#FAFAFA]">{count}</span>
                      <span className="text-[10px] text-[#52525B]">({Math.round(percent)}%)</span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-[#27272A] overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-700" 
                      style={{ width: `${percent}%`, backgroundColor: config.color }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-5 pt-4 border-t border-[#27272A]">
            <div className="flex justify-between items-center">
              <span className="text-xs text-[#71717A]">Total MRR</span>
              <span className="text-sm font-bold text-[#22C55E]">
                ${Object.entries(planDistribution).reduce((sum, [key, count]) => {
                  const config = PLAN_CONFIG[key as keyof typeof PLAN_CONFIG];
                  return sum + (config?.price || 0) * count;
                }, 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-[#18181B] border border-[#27272A] rounded-xl p-5 hover:border-[#3F3F46] transition-all duration-200">
          <h3 className="text-sm font-semibold text-[#FAFAFA] mb-5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
            Performance Overview
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <MetricCard label="Response Time" value={liveMetrics?.avgResponseTime || performanceMetrics.avgResponseTime} color="#3B82F6" />
            <MetricCard label="Completion" value={`${liveMetrics?.jobCompletionRate ?? performanceMetrics.jobCompletionRate}%`} color="#22C55E" />
            <MetricCard label="Rating" value={`${liveMetrics?.customerRating ?? 0}/5`} color="#8B5CF6" subLabel={liveMetrics?.totalReviews ? `${liveMetrics.totalReviews} reviews` : undefined} />
            <MetricCard label="Efficiency" value={`${liveMetrics?.efficiencyRate ?? 0}%`} color="#F97316" />
          </div>
          <div className="mt-4 pt-4 border-t border-[#27272A]">
            <p className="text-xs text-[#71717A] mb-2">Weekly Job Trend</p>
            <MiniBarChart data={weeklyJobData} color="#22C55E" height={40} />
          </div>
        </div>

        {/* Service Distribution */}
        <div className="bg-[#18181B] border border-[#27272A] rounded-xl p-5 hover:border-[#3F3F46] transition-all duration-200">
          <h3 className="text-sm font-semibold text-[#FAFAFA] mb-5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#F97316]" />
            Service Distribution
          </h3>
          <div className="space-y-4">
            {(liveMetrics?.serviceDistribution && liveMetrics.serviceDistribution.length > 0) ? (
              liveMetrics.serviceDistribution.slice(0, 4).map((service, index) => {
                const colors = ['#22C55E', '#3B82F6', '#8B5CF6', '#F97316', '#EF4444', '#06B6D4'];
                return (
                  <ServiceBar 
                    key={service.name} 
                    label={service.name} 
                    value={service.percentage} 
                    color={colors[index % colors.length]} 
                  />
                );
              })
            ) : (
              <div className="text-center py-4 text-xs text-[#52525B]">
                No service data available yet
              </div>
            )}
          </div>
          <div className="mt-5 pt-4 border-t border-[#27272A] grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-[#27272A]/30 rounded-lg">
              <p className="text-lg font-bold text-[#22C55E]">{liveMetrics?.servicesToday ?? 0}</p>
              <p className="text-[10px] text-[#52525B]">Services Today</p>
            </div>
            <div className="text-center p-3 bg-[#27272A]/30 rounded-lg">
              <p className="text-lg font-bold text-[#3B82F6]">${((liveMetrics?.revenueToday ?? 0) / 1000).toFixed(1)}k</p>
              <p className="text-[10px] text-[#52525B]">Revenue Today</p>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Organization Structure */}
      <div className="bg-[#18181B] border border-[#27272A] rounded-xl p-5 hover:border-[#3F3F46] transition-all duration-200">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-semibold text-[#FAFAFA] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#3B82F6]" />
            Organization Structure
          </h3>
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search shops..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-48 px-3 py-1.5 bg-[#27272A] border border-[#3F3F46] rounded-lg text-xs text-[#FAFAFA] placeholder-[#52525B] focus:outline-none focus:border-[#F97316]"
              />
              <svg className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-[#52525B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            {/* View Toggle */}
            <div className="flex bg-[#27272A] rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 text-xs rounded-md transition-colors ${viewMode === 'grid' ? 'bg-[#F97316] text-white' : 'text-[#71717A] hover:text-[#A1A1AA]'}`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 text-xs rounded-md transition-colors ${viewMode === 'list' ? 'bg-[#F97316] text-white' : 'text-[#71717A] hover:text-[#A1A1AA]'}`}
              >
                List
              </button>
            </div>
            <button className="text-xs px-3 py-1.5 bg-[#22C55E]/10 hover:bg-[#22C55E]/20 text-[#22C55E] rounded-lg transition-colors">
              + Add Shop
            </button>
          </div>
        </div>

        {filteredSubscriptions.length === 0 ? (
          <div className="py-12 text-center">
            <div className="w-14 h-14 rounded-xl bg-[#27272A] flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🏪</span>
            </div>
            <p className="text-sm text-[#71717A]">
              {searchTerm ? 'No shops match your search' : 'No active shops'}
            </p>
            <p className="text-xs text-[#52525B] mt-1">
              {searchTerm ? 'Try a different search term' : 'Shops will appear here once added'}
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredSubscriptions.map((subscription) => {
              const planConfig = PLAN_CONFIG[subscription.plan.toLowerCase() as keyof typeof PLAN_CONFIG] || PLAN_CONFIG.starter;
              const utilization = subscription.maxUsers > 0 ? Math.round((subscription.userCount / subscription.maxUsers) * 100) : 0;

              return (
                <div 
                  key={subscription.id} 
                  className="bg-[#27272A]/30 border border-[#3F3F46] rounded-xl p-5 hover:border-[#52525B] transition-all duration-200"
                >
                  {/* Shop Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-11 h-11 rounded-xl flex items-center justify-center text-base font-bold"
                        style={{ backgroundColor: `${planConfig.color}15`, color: planConfig.color }}
                      >
                        {subscription.shop.shopName[0]}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-[#FAFAFA]">{subscription.shop.shopName}</h4>
                        <p className="text-xs text-[#71717A]">{subscription.shop.ownerName}</p>
                      </div>
                    </div>
                    <span 
                      className="text-[10px] font-medium px-2 py-1 rounded-full"
                      style={{ backgroundColor: `${planConfig.color}15`, color: planConfig.color }}
                    >
                      {planConfig.name}
                    </span>
                  </div>

                  {/* Owner Section */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
                      <span className="text-[10px] text-[#52525B] uppercase tracking-wider">Owner</span>
                    </div>
                    <div className="p-3 bg-[#18181B] border border-[#27272A] rounded-lg">
                      <p className="text-xs text-[#FAFAFA] font-medium">{subscription.shop.ownerName}</p>
                      <p className="text-[10px] text-[#71717A]">{subscription.shop.email}</p>
                    </div>
                  </div>

                  {/* Team Section */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]" />
                        <span className="text-[10px] text-[#52525B] uppercase tracking-wider">Team</span>
                      </div>
                      <span className="text-[10px] text-[#71717A]">{subscription.techs.length} members</span>
                    </div>
                    {subscription.techs.length === 0 ? (
                      <div className="p-3 bg-[#18181B] border border-[#27272A] rounded-lg">
                        <p className="text-[10px] text-[#52525B] italic">No technicians assigned</p>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {subscription.techs.slice(0, 4).map((tech) => (
                          <div 
                            key={tech.id} 
                            className="w-8 h-8 rounded-lg bg-[#3B82F6]/10 flex items-center justify-center text-[10px] font-medium text-[#3B82F6]"
                            title={`${tech.firstName} ${tech.lastName}`}
                          >
                            {tech.firstName[0]}{tech.lastName[0]}
                          </div>
                        ))}
                        {subscription.techs.length > 4 && (
                          <div className="w-8 h-8 rounded-lg bg-[#27272A] flex items-center justify-center text-[10px] text-[#71717A]">
                            +{subscription.techs.length - 4}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Capacity Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between mb-1">
                      <span className="text-[10px] text-[#52525B]">Seat Utilization</span>
                      <span className="text-[10px] text-[#71717A]">{subscription.userCount}/{subscription.maxUsers}</span>
                    </div>
                    <div className="h-2 rounded-full bg-[#18181B] overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{ 
                          width: `${utilization}%`, 
                          backgroundColor: utilization > 90 ? '#EF4444' : utilization > 70 ? '#F97316' : planConfig.color 
                        }}
                      />
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="text-center p-2 bg-[#18181B] rounded-lg">
                      <p className="text-sm font-bold text-[#22C55E]">{subscription.metrics?.totalJobs || 0}</p>
                      <p className="text-[9px] text-[#52525B]">Jobs</p>
                    </div>
                    <div className="text-center p-2 bg-[#18181B] rounded-lg">
                      <p className="text-sm font-bold text-[#3B82F6]">${((subscription.metrics?.totalRevenue || 0) / 1000).toFixed(1)}k</p>
                      <p className="text-[9px] text-[#52525B]">Revenue</p>
                    </div>
                    <div className="text-center p-2 bg-[#18181B] rounded-lg">
                      <p className="text-sm font-bold text-[#8B5CF6]">{subscription.metrics?.completionRate || 0}%</p>
                      <p className="text-[9px] text-[#52525B]">Completed</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-3 border-t border-[#3F3F46]">
                    <button className="flex-1 py-2 text-xs text-[#A1A1AA] hover:text-[#FAFAFA] bg-[#18181B] hover:bg-[#27272A] rounded-lg transition-colors">
                      View Details
                    </button>
                    <button className="flex-1 py-2 text-xs text-[#F97316] hover:text-[#FB923C] bg-[#F97316]/10 hover:bg-[#F97316]/20 rounded-lg transition-colors">
                      Manage
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List View */
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#27272A]">
                  <th className="text-left text-xs text-[#71717A] font-medium pb-3 pr-4">Shop</th>
                  <th className="text-left text-xs text-[#71717A] font-medium pb-3 pr-4">Owner</th>
                  <th className="text-center text-xs text-[#71717A] font-medium pb-3 pr-4">Plan</th>
                  <th className="text-center text-xs text-[#71717A] font-medium pb-3 pr-4">Team</th>
                  <th className="text-center text-xs text-[#71717A] font-medium pb-3 pr-4">Jobs</th>
                  <th className="text-center text-xs text-[#71717A] font-medium pb-3 pr-4">Revenue</th>
                  <th className="text-center text-xs text-[#71717A] font-medium pb-3 pr-4">Capacity</th>
                  <th className="text-right text-xs text-[#71717A] font-medium pb-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubscriptions.map((subscription) => {
                  const planConfig = PLAN_CONFIG[subscription.plan.toLowerCase() as keyof typeof PLAN_CONFIG] || PLAN_CONFIG.starter;
                  const utilization = subscription.maxUsers > 0 ? Math.round((subscription.userCount / subscription.maxUsers) * 100) : 0;

                  return (
                    <tr key={subscription.id} className="border-b border-[#27272A]/50 last:border-0 hover:bg-[#27272A]/30 transition-colors">
                      <td className="py-4 pr-4">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold"
                            style={{ backgroundColor: `${planConfig.color}15`, color: planConfig.color }}
                          >
                            {subscription.shop.shopName[0]}
                          </div>
                          <div>
                            <p className="text-sm text-[#FAFAFA] font-medium">{subscription.shop.shopName}</p>
                            <p className="text-[10px] text-[#52525B]">{subscription.shop.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 pr-4 text-sm text-[#71717A]">{subscription.shop.ownerName}</td>
                      <td className="py-4 pr-4 text-center">
                        <span 
                          className="text-xs px-2 py-1 rounded-full font-medium"
                          style={{ backgroundColor: `${planConfig.color}15`, color: planConfig.color }}
                        >
                          {planConfig.name}
                        </span>
                      </td>
                      <td className="py-4 pr-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {subscription.techs.slice(0, 3).map((tech) => (
                            <div 
                              key={tech.id}
                              className="w-6 h-6 rounded bg-[#3B82F6]/10 flex items-center justify-center text-[9px] font-medium text-[#3B82F6]"
                            >
                              {tech.firstName[0]}
                            </div>
                          ))}
                          {subscription.techs.length > 3 && (
                            <span className="text-xs text-[#71717A]">+{subscription.techs.length - 3}</span>
                          )}
                          {subscription.techs.length === 0 && (
                            <span className="text-xs text-[#52525B]">-</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 pr-4 text-center">
                        <span className="text-xs text-[#22C55E] font-medium">{subscription.metrics?.totalJobs || 0}</span>
                      </td>
                      <td className="py-4 pr-4 text-center">
                        <span className="text-xs text-[#3B82F6] font-medium">${((subscription.metrics?.totalRevenue || 0) / 1000).toFixed(1)}k</span>
                      </td>
                      <td className="py-4 pr-4">
                        <div className="flex flex-col items-center">
                          <span className="text-xs text-[#A1A1AA] mb-1">{subscription.userCount}/{subscription.maxUsers}</span>
                          <div className="w-20 h-1.5 rounded-full bg-[#27272A] overflow-hidden">
                            <div 
                              className="h-full rounded-full"
                              style={{ 
                                width: `${utilization}%`, 
                                backgroundColor: utilization > 90 ? '#EF4444' : utilization > 70 ? '#F97316' : '#22C55E' 
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-4 text-right">
                        <button className="text-xs text-[#F97316] hover:text-[#FB923C] font-medium">
                          Manage →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {filteredSubscriptions.length > 0 && (
          <div className="mt-4 pt-4 border-t border-[#27272A] flex items-center justify-between">
            <p className="text-xs text-[#52525B]">
              Showing {filteredSubscriptions.length} of {activeSubscriptions.length} shops
            </p>
            <button className="text-xs text-[#F97316] hover:text-[#FB923C] font-medium">
              Export Organization Data →
            </button>
          </div>
        )}
      </div>

      {/* Section 4: Pending Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-[#18181B] border border-[#27272A] rounded-xl p-5 hover:border-[#3F3F46] transition-all duration-200">
          <h3 className="text-sm font-semibold text-[#FAFAFA] mb-5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#F97316]" />
            Pending Actions
          </h3>
          <div className="space-y-3">
            <ActionItem label="Shop Applications" value={liveMetrics?.pendingActions?.shopApplications ?? 0} type="warning" action="Review" href="/admin/pending-shops" />
            <ActionItem label="Pending Work Orders" value={liveMetrics?.pendingActions?.pendingWorkOrders ?? 0} type="info" action="Assign" href="/admin/command-center" />
            <ActionItem label="Overdue Jobs" value={liveMetrics?.pendingActions?.overdueWorkOrders ?? 0} type="error" action="Urgent" href="/admin/command-center?filter=overdue" />
            <ActionItem label="Expiring Subscriptions" value={liveMetrics?.pendingActions?.expiringSubscriptions ?? 0} type="warning" action="Notify" href="/admin/subscriptions?filter=expiring" />
          </div>
        </div>

        <div className="bg-[#18181B] border border-[#27272A] rounded-xl p-5 hover:border-[#3F3F46] transition-all duration-200">
          <h3 className="text-sm font-semibold text-[#FAFAFA] mb-5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
            Quick Stats
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-[#22C55E]/5 border border-[#22C55E]/20 rounded-xl text-center">
              <p className="text-2xl font-bold text-[#22C55E]">{performanceMetrics.completedThisMonth}</p>
              <p className="text-xs text-[#71717A]">Jobs This Month</p>
            </div>
            <div className="p-4 bg-[#3B82F6]/5 border border-[#3B82F6]/20 rounded-xl text-center">
              <p className="text-2xl font-bold text-[#3B82F6]">${(performanceMetrics.totalPlatformRevenue / 1000).toFixed(1)}k</p>
              <p className="text-xs text-[#71717A]">Total Revenue</p>
            </div>
            <div className="p-4 bg-[#8B5CF6]/5 border border-[#8B5CF6]/20 rounded-xl text-center">
              <p className="text-2xl font-bold text-[#8B5CF6]">{performanceMetrics.totalWorkOrders}</p>
              <p className="text-xs text-[#71717A]">Total Jobs</p>
            </div>
            <div className="p-4 bg-[#F97316]/5 border border-[#F97316]/20 rounded-xl text-center">
              <p className="text-2xl font-bold text-[#F97316]">{performanceMetrics.jobCompletionRate}%</p>
              <p className="text-xs text-[#71717A]">Completion Rate</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper Components

function MetricCard({ label, value, color, subLabel }: { label: string; value: string; color: string; subLabel?: string }) {
  return (
    <div className="p-3 bg-[#27272A]/30 rounded-lg border border-[#3F3F46] text-center">
      <p className="text-lg font-bold" style={{ color }}>{value}</p>
      <p className="text-[10px] text-[#52525B]">{label}</p>
      {subLabel && <p className="text-[9px] text-[#3F3F46] mt-0.5">{subLabel}</p>}
    </div>
  );
}

function ServiceBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-[#A1A1AA]">{label}</span>
        <span className="text-xs font-medium" style={{ color }}>{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-[#27272A] overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function ActionItem({ label, value, type, action, href }: { label: string; value: number; type: 'warning' | 'error' | 'info'; action: string; href?: string }) {
  const colors = {
    warning: { bg: 'bg-[#F97316]/10', text: 'text-[#F97316]', badge: 'bg-[#F97316]' },
    error: { bg: 'bg-[#EF4444]/10', text: 'text-[#EF4444]', badge: 'bg-[#EF4444]' },
    info: { bg: 'bg-[#3B82F6]/10', text: 'text-[#3B82F6]', badge: 'bg-[#3B82F6]' }
  };

  return (
    <div className={`flex items-center justify-between p-3 ${colors[type].bg} rounded-lg`}>
      <div className="flex items-center gap-3">
        <span className={`w-6 h-6 ${colors[type].badge} rounded-full flex items-center justify-center text-xs font-bold text-white`}>
          {value}
        </span>
        <span className="text-sm text-[#FAFAFA]">{label}</span>
      </div>
      {href ? (
        <a href={href} className={`text-xs font-medium ${colors[type].text} hover:underline`}>
          {action} →
        </a>
      ) : (
        <button className={`text-xs font-medium ${colors[type].text} hover:underline`}>
          {action} →
        </button>
      )}
    </div>
  );
}
