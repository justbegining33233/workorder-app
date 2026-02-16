'use client';

import React from 'react';

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
  trialStart?: string;
  trialEnd?: string;
  shop: {
    shopName: string;
    ownerName: string;
    email: string;
    status: string;
  };
  techs: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  }>;
  userCount: number;
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

interface ThreeMonthAverages {
  avgNewClientsPerMonth: number;
  avgJobIncomePerMonth: string;
  avgSubscriptionRevenuePerMonth: string;
  churnRate: string;
  churnRateRaw?: number;
  totalClientsLast3Months: number;
  totalJobIncomeLast3Months: string;
}

interface SubscriptionsTabProps {
  subscriptions: SubscriptionData[];
  liveMetrics?: LiveMetrics;
  threeMonthAverages?: ThreeMonthAverages;
}

// Chart Components
function MiniLineChart({ data, color, height = 40 }: { data: number[]; color: string; height?: number }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 100;
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');
  
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }}>
      <defs>
        <linearGradient id={`sub-gradient-${color.replace('#', '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline fill="none" stroke={color} strokeWidth="2" points={points} strokeLinecap="round" strokeLinejoin="round" />
      <polygon fill={`url(#sub-gradient-${color.replace('#', '')})`} points={`0,${height} ${points} ${width},${height}`} />
    </svg>
  );
}

function DonutChart({ value, color, size = 80, label }: { value: number; color: string; size?: number; label?: string }) {
  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;
  
  return (
    <div className="relative">
      <svg width={size} height={size} viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={radius} fill="none" stroke="#27272A" strokeWidth="8" />
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 40 40)"
          className="transition-all duration-700"
        />
        <text x="40" y="38" textAnchor="middle" fill="#FAFAFA" fontSize="16" fontWeight="700">
          {value}%
        </text>
        {label && (
          <text x="40" y="52" textAnchor="middle" fill="#71717A" fontSize="9">
            {label}
          </text>
        )}
      </svg>
    </div>
  );
}

function StackedBarChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  return (
    <div className="space-y-2">
      <div className="h-4 rounded-full bg-[#27272A] overflow-hidden flex">
        {data.map((item, i) => (
          <div
            key={i}
            className="h-full transition-all duration-700"
            style={{ width: `${(item.value / total) * 100}%`, backgroundColor: item.color }}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-3">
        {data.map((item, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-[10px] text-[#71717A]">{item.label}</span>
            <span className="text-[10px] font-medium text-[#A1A1AA]">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const PLAN_DETAILS = {
  starter: { name: 'Starter', price: 99, color: '#22C55E', userLimit: 5 },
  growth: { name: 'Growth', price: 199, color: '#3B82F6', userLimit: 15 },
  professional: { name: 'Professional', price: 349, color: '#8B5CF6', userLimit: 50 },
  business: { name: 'Business', price: 599, color: '#F97316', userLimit: 200 },
  enterprise: { name: 'Enterprise', price: 999, color: '#EF4444', userLimit: 999 }
};

export function SubscriptionsTab({ subscriptions, liveMetrics, threeMonthAverages }: SubscriptionsTabProps) {
  const activeSubscriptions = subscriptions.filter(sub => sub.status === 'active');
  const trialingSubscriptions = subscriptions.filter(sub => sub.status === 'trialing');
  const canceledSubscriptions = subscriptions.filter(sub => sub.status === 'canceled' || sub.status === 'cancelled');
  const pastDueSubscriptions = subscriptions.filter(sub => sub.status === 'past_due');
  
  // Use live MRR if available, otherwise calculate from subscriptions
  const totalRevenue = liveMetrics?.totalMRR || activeSubscriptions.reduce((sum, sub) => {
    const plan = PLAN_DETAILS[sub.plan.toLowerCase() as keyof typeof PLAN_DETAILS];
    return sum + (plan?.price || 0);
  }, 0);

  const planStats = Object.entries(PLAN_DETAILS).map(([key, plan]) => {
    const count = activeSubscriptions.filter(sub => sub.plan.toLowerCase() === key).length;
    // Use live revenue by plan if available
    const revenue = liveMetrics?.revenueByPlan?.[key] || count * plan.price;
    return { ...plan, count, revenue, key };
  });

  // Use live trend data if available
  const defaultMrrTrend = [0, 0, 0, 0, 0, 0, totalRevenue];
  const defaultSubsTrend = [0, 0, 0, 0, 0, 0, subscriptions.length];
  const mrrTrend = (liveMetrics?.revenueTrend ?? []).length > 0 ? (liveMetrics?.revenueTrend ?? defaultMrrTrend) : defaultMrrTrend;
  const subsTrend = (liveMetrics?.subscriptionTrend ?? []).length > 0 ? (liveMetrics?.subscriptionTrend ?? defaultSubsTrend) : defaultSubsTrend;
  
  // Calculate churn rate from live data
  const churnRateValue = threeMonthAverages?.churnRateRaw || 0;
  const retentionValue = liveMetrics?.retentionRateRaw || 100;
  
  // Get growth percentages from live data
  const mrrGrowth = liveMetrics?.momGrowth || '+0%';
  const arrGrowth = liveMetrics?.yoyGrowth || '+0%';
  
  // ARR calculation from live data
  const annualRevenue = liveMetrics?.annualRecurringRevenue || totalRevenue * 12;
  
  // LTV from live data
  const ltvValue = liveMetrics?.ltv || '$0';
  
  // Conversion rate from live data
  const conversionRate = parseFloat(liveMetrics?.conversionRate?.replace('%', '') || '0');

  return (
    <div className="space-y-6">
      {/* Section 1: Revenue Overview with Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-[#18181B] border border-[#27272A] rounded-xl p-5 hover:border-[#3F3F46] transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-[#71717A] uppercase tracking-wider font-medium">Monthly Revenue</p>
              <p className="text-2xl font-bold text-[#FAFAFA] mt-1">${totalRevenue.toLocaleString()}</p>
            </div>
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${mrrGrowth.startsWith('+') ? 'bg-[#22C55E]/10' : 'bg-[#EF4444]/10'}`}>
              <svg className={`w-3 h-3 ${mrrGrowth.startsWith('+') ? 'text-[#22C55E]' : 'text-[#EF4444] rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              <span className={`text-xs font-medium ${mrrGrowth.startsWith('+') ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>{mrrGrowth}</span>
            </div>
          </div>
          <MiniLineChart data={mrrTrend} color="#22C55E" height={50} />
          <p className="text-[10px] text-[#52525B] mt-2">MRR growth trend</p>
        </div>

        <div className="bg-[#18181B] border border-[#27272A] rounded-xl p-5 hover:border-[#3F3F46] transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-[#71717A] uppercase tracking-wider font-medium">Annual Revenue</p>
              <p className="text-2xl font-bold text-[#FAFAFA] mt-1">${annualRevenue.toLocaleString()}</p>
            </div>
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${arrGrowth.startsWith('+') ? 'bg-[#3B82F6]/10' : 'bg-[#EF4444]/10'}`}>
              <svg className={`w-3 h-3 ${arrGrowth.startsWith('+') ? 'text-[#3B82F6]' : 'text-[#EF4444] rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              <span className={`text-xs font-medium ${arrGrowth.startsWith('+') ? 'text-[#3B82F6]' : 'text-[#EF4444]'}`}>{arrGrowth}</span>
            </div>
          </div>
          <MiniLineChart data={subsTrend} color="#3B82F6" height={50} />
          <p className="text-[10px] text-[#52525B] mt-2">Subscription count trend</p>
        </div>

        <div className="bg-[#18181B] border border-[#27272A] rounded-xl p-5 hover:border-[#3F3F46] transition-all duration-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-[#71717A] uppercase tracking-wider font-medium">Churn Rate</p>
              <p className="text-2xl font-bold text-[#FAFAFA] mt-1">{threeMonthAverages?.churnRate || '0%'}</p>
              <p className={`text-xs mt-1 ${liveMetrics?.retentionChange?.startsWith('+') ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                {liveMetrics?.retentionChange || '0%'} retention change
              </p>
            </div>
            <DonutChart value={retentionValue} color="#22C55E" size={70} label="retained" />
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-[#27272A]">
            <div>
              <p className="text-[10px] text-[#52525B]">Canceled</p>
              <p className="text-sm font-medium text-[#EF4444]">{canceledSubscriptions.length}</p>
            </div>
            <div>
              <p className="text-[10px] text-[#52525B]">Past Due</p>
              <p className="text-sm font-medium text-[#F97316]">{pastDueSubscriptions.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-[#18181B] border border-[#27272A] rounded-xl p-5 hover:border-[#3F3F46] transition-all duration-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-[#71717A] uppercase tracking-wider font-medium">Lifetime Value</p>
              <p className="text-2xl font-bold text-[#FAFAFA] mt-1">{ltvValue}</p>
              <p className="text-xs text-[#71717A] mt-1">{liveMetrics?.avgLifetimeMonths || 0} mo avg lifetime</p>
            </div>
            <DonutChart value={Math.min(conversionRate, 100)} color="#8B5CF6" size={70} label="conv" />
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-[#27272A]">
            <div>
              <p className="text-[10px] text-[#52525B]">Conversion</p>
              <p className="text-sm font-medium text-[#22C55E]">{liveMetrics?.conversionRate || '0%'}</p>
            </div>
            <div>
              <p className="text-[10px] text-[#52525B]">Avg Rating</p>
              <p className="text-sm font-medium text-[#A1A1AA]">{liveMetrics?.avgRating || '0.0'} ⭐</p>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Plan Distribution & Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Revenue by Plan */}
        <div className="bg-[#18181B] border border-[#27272A] rounded-xl p-5 hover:border-[#3F3F46] transition-all duration-200">
          <h3 className="text-sm font-semibold text-[#FAFAFA] mb-5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#F97316]" />
            Revenue by Plan
          </h3>
          <div className="space-y-4">
            {planStats.filter(p => p.count > 0).map((plan) => (
              <div key={plan.key} className="flex items-center gap-3">
                <span className="text-xs text-[#A1A1AA] w-24 truncate">{plan.name}</span>
                <div className="flex-1 h-2.5 rounded-full bg-[#27272A] overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-700"
                    style={{ 
                      width: `${totalRevenue > 0 ? (plan.revenue / totalRevenue) * 100 : 0}%`,
                      backgroundColor: plan.color 
                    }}
                  />
                </div>
                <span className="text-xs font-medium text-[#FAFAFA] w-16 text-right">${plan.revenue.toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 pt-4 border-t border-[#27272A]">
            <StackedBarChart data={planStats.filter(p => p.count > 0).map(p => ({
              label: p.name,
              value: p.count,
              color: p.color
            }))} />
          </div>
        </div>

        {/* Subscription Lifecycle */}
        <div className="bg-[#18181B] border border-[#27272A] rounded-xl p-5 hover:border-[#3F3F46] transition-all duration-200">
          <h3 className="text-sm font-semibold text-[#FAFAFA] mb-5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
            Subscription Lifecycle
          </h3>
          <div className="space-y-4">
            <LifecycleStep 
              label="Total Signups" 
              value={liveMetrics?.totalShopsEver || 0} 
              rate={100} 
              color="#3B82F6" 
            />
            <LifecycleStep 
              label="In Trial" 
              value={trialingSubscriptions.length} 
              rate={liveMetrics?.totalShopsEver ? (trialingSubscriptions.length / liveMetrics.totalShopsEver) * 100 : 0} 
              color="#8B5CF6" 
            />
            <LifecycleStep 
              label="Active Members" 
              value={activeSubscriptions.length} 
              rate={liveMetrics?.totalShopsEver ? (activeSubscriptions.length / liveMetrics.totalShopsEver) * 100 : 0} 
              color="#22C55E" 
            />
            <LifecycleStep 
              label="Converted" 
              value={liveMetrics?.convertedCustomersCount || 0} 
              rate={conversionRate} 
              color="#F97316" 
            />
          </div>
          <div className="mt-5 pt-4 border-t border-[#27272A] grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-[#27272A]/30 rounded-lg">
              <p className="text-lg font-bold text-[#22C55E]">{liveMetrics?.conversionRate || '0%'}</p>
              <p className="text-[10px] text-[#52525B]">Conversion Rate</p>
            </div>
            <div className="text-center p-3 bg-[#27272A]/30 rounded-lg">
              <p className="text-lg font-bold text-[#3B82F6]">{liveMetrics?.retentionRate || '0%'}</p>
              <p className="text-[10px] text-[#52525B]">Retention Rate</p>
            </div>
          </div>
        </div>

        {/* Growth Metrics */}
        <div className="bg-[#18181B] border border-[#27272A] rounded-xl p-5 hover:border-[#3F3F46] transition-all duration-200">
          <h3 className="text-sm font-semibold text-[#FAFAFA] mb-5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#3B82F6]" />
            Growth & Expansion
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <MetricCard label="MoM Growth" value={liveMetrics?.momGrowth || '0%'} positive={liveMetrics?.momGrowth?.startsWith('+')} />
            <MetricCard label="YoY Growth" value={liveMetrics?.yoyGrowth || '0%'} positive={liveMetrics?.yoyGrowth?.startsWith('+')} />
            <MetricCard label="Monthly MRR" value={`$${totalRevenue.toLocaleString()}`} positive />
            <MetricCard label="Churn Rate" value={threeMonthAverages?.churnRate || '0%'} negative={churnRateValue > 5} />
            <MetricCard label="Active Subs" value={activeSubscriptions.length.toString()} positive />
            <MetricCard label="In Trial" value={trialingSubscriptions.length.toString()} />
          </div>
          <div className="mt-4 pt-4 border-t border-[#27272A]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[#71717A]">Revenue Distribution</span>
              <span className="text-xs font-medium text-[#22C55E]">${totalRevenue.toLocaleString()}/mo</span>
            </div>
            <div className="h-2 rounded-full bg-[#27272A] overflow-hidden flex">
              {planStats.filter(p => p.count > 0).map((p, i) => (
                <div 
                  key={p.key} 
                  className="h-full" 
                  style={{ 
                    width: `${totalRevenue > 0 ? (p.revenue / totalRevenue) * 100 : 0}%`,
                    backgroundColor: p.color 
                  }} 
                />
              ))}
            </div>
            <div className="flex justify-between mt-1 text-[9px] text-[#52525B]">
              {planStats.filter(p => p.count > 0).slice(0, 3).map(p => (
                <span key={p.key}>{p.name}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
        {planStats.map((plan) => (
          <div 
            key={plan.key} 
            className="bg-[#18181B] border border-[#27272A] rounded-xl p-5 hover:border-[#3F3F46] transition-all duration-200 relative overflow-hidden"
          >
            <div 
              className="absolute top-0 right-0 w-20 h-20 rounded-full blur-3xl opacity-20"
              style={{ backgroundColor: plan.color }}
            />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <span 
                  className="text-xs font-medium px-2 py-1 rounded-full"
                  style={{ backgroundColor: `${plan.color}15`, color: plan.color }}
                >
                  {plan.name}
                </span>
                <span className="text-xs text-[#52525B]">${plan.price}/mo</span>
              </div>
              <p className="text-3xl font-bold text-[#FAFAFA]">{plan.count}</p>
              <p className="text-xs text-[#71717A] mb-4">active subscriptions</p>
              <div className="space-y-2 pt-3 border-t border-[#27272A]">
                <div className="flex justify-between text-xs">
                  <span className="text-[#71717A]">Revenue</span>
                  <span className="font-medium" style={{ color: plan.color }}>${plan.revenue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#71717A]">User Limit</span>
                  <span className="text-[#A1A1AA]">{plan.userLimit}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#71717A]">% of Total</span>
                  <span className="text-[#A1A1AA]">
                    {activeSubscriptions.length > 0 ? Math.round((plan.count / activeSubscriptions.length) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Section 4: Active Subscriptions List */}
      <div className="bg-[#18181B] border border-[#27272A] rounded-xl p-5 hover:border-[#3F3F46] transition-all duration-200">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-semibold text-[#FAFAFA] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#8B5CF6]" />
            Active Subscriptions
          </h3>
          <div className="flex gap-2">
            <button className="text-xs px-3 py-1.5 bg-[#27272A] hover:bg-[#3F3F46] text-[#A1A1AA] rounded-lg transition-colors">
              Export CSV
            </button>
            <button className="text-xs px-3 py-1.5 bg-[#22C55E]/10 hover:bg-[#22C55E]/20 text-[#22C55E] rounded-lg transition-colors">
              + Add Subscription
            </button>
          </div>
        </div>
        
        {activeSubscriptions.length === 0 ? (
          <div className="py-12 text-center">
            <div className="w-14 h-14 rounded-xl bg-[#27272A] flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-[#52525B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <p className="text-sm text-[#71717A]">No active subscriptions</p>
            <p className="text-xs text-[#52525B] mt-1">Subscriptions will appear here once added</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {activeSubscriptions.map((subscription) => {
              const plan = PLAN_DETAILS[subscription.plan.toLowerCase() as keyof typeof PLAN_DETAILS] || PLAN_DETAILS.starter;
              const utilizationPercent = Math.round((subscription.userCount / subscription.maxUsers) * 100);
              
              return (
                <div 
                  key={subscription.id} 
                  className="p-4 bg-[#27272A]/30 border border-[#3F3F46] rounded-xl hover:border-[#52525B] transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold"
                        style={{ backgroundColor: `${plan.color}15`, color: plan.color }}
                      >
                        {subscription.shop.shopName[0]}
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-[#FAFAFA]">{subscription.shop.shopName}</h4>
                        <p className="text-xs text-[#71717A]">{subscription.shop.ownerName}</p>
                      </div>
                    </div>
                    <span 
                      className="text-xs font-medium px-2 py-1 rounded-full"
                      style={{ backgroundColor: `${plan.color}15`, color: plan.color }}
                    >
                      {plan.name}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div>
                      <p className="text-[10px] text-[#52525B]">MRR</p>
                      <p className="text-sm font-medium text-[#22C55E]">${plan.price}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#52525B]">Users</p>
                      <p className="text-sm font-medium text-[#FAFAFA]">{subscription.userCount}/{subscription.maxUsers}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#52525B]">Next Bill</p>
                      <p className="text-sm font-medium text-[#A1A1AA]">
                        {new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="flex justify-between mb-1">
                      <span className="text-[10px] text-[#52525B]">Seat Utilization</span>
                      <span className="text-[10px] text-[#71717A]">{utilizationPercent}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[#27272A] overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{ 
                          width: `${utilizationPercent}%`, 
                          backgroundColor: utilizationPercent > 90 ? '#EF4444' : utilizationPercent > 70 ? '#F97316' : plan.color 
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-3 border-t border-[#3F3F46]">
                    <button className="flex-1 py-1.5 text-xs text-[#A1A1AA] hover:text-[#FAFAFA] bg-[#27272A] hover:bg-[#3F3F46] rounded-lg transition-colors">
                      View Details
                    </button>
                    <button className="flex-1 py-1.5 text-xs text-[#F97316] hover:text-[#FB923C] bg-[#F97316]/10 hover:bg-[#F97316]/20 rounded-lg transition-colors">
                      Manage Plan
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Section 5: Payment & Billing Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-[#18181B] border border-[#27272A] rounded-xl p-5 hover:border-[#3F3F46] transition-all duration-200">
          <h3 className="text-sm font-semibold text-[#FAFAFA] mb-5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
            Payment Health
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-[#22C55E]/5 border border-[#22C55E]/20 rounded-xl text-center">
              <p className="text-2xl font-bold text-[#22C55E]">{activeSubscriptions.length}</p>
              <p className="text-xs text-[#71717A]">Active & Paid</p>
            </div>
            <div className="p-4 bg-[#EF4444]/5 border border-[#EF4444]/20 rounded-xl text-center">
              <p className="text-2xl font-bold text-[#EF4444]">{pastDueSubscriptions.length}</p>
              <p className="text-xs text-[#71717A]">Past Due</p>
            </div>
            <div className="p-4 bg-[#F97316]/5 border border-[#F97316]/20 rounded-xl text-center">
              <p className="text-2xl font-bold text-[#F97316]">{trialingSubscriptions.length}</p>
              <p className="text-xs text-[#71717A]">In Trial</p>
            </div>
            <div className="p-4 bg-[#71717A]/5 border border-[#3F3F46] rounded-xl text-center">
              <p className="text-2xl font-bold text-[#71717A]">{canceledSubscriptions.length}</p>
              <p className="text-xs text-[#71717A]">Canceled</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-[#27272A]">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#71717A]">Retention Rate</span>
              <span className="text-sm font-bold text-[#22C55E]">{liveMetrics?.retentionRate || '100%'}</span>
            </div>
          </div>
        </div>

        <div className="bg-[#18181B] border border-[#27272A] rounded-xl p-5 hover:border-[#3F3F46] transition-all duration-200">
          <h3 className="text-sm font-semibold text-[#FAFAFA] mb-5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#3B82F6]" />
            Upcoming Renewals
          </h3>
          <div className="space-y-3">
            {activeSubscriptions.slice(0, 4).map((sub, i) => {
              const plan = PLAN_DETAILS[sub.plan.toLowerCase() as keyof typeof PLAN_DETAILS] || PLAN_DETAILS.starter;
              const daysUntilRenewal = Math.ceil((new Date(sub.currentPeriodEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
              return (
                <div key={sub.id} className="flex items-center justify-between p-3 bg-[#27272A]/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                      style={{ backgroundColor: `${plan.color}15`, color: plan.color }}
                    >
                      {sub.shop.shopName[0]}
                    </div>
                    <div>
                      <p className="text-sm text-[#FAFAFA]">{sub.shop.shopName}</p>
                      <p className="text-[10px] text-[#52525B]">${plan.price}/mo • {plan.name}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    daysUntilRenewal <= 7 ? 'bg-[#F97316]/10 text-[#F97316]' : 'bg-[#27272A] text-[#71717A]'
                  }`}>
                    {daysUntilRenewal}d
                  </span>
                </div>
              );
            })}
          </div>
          {activeSubscriptions.length > 4 && (
            <button className="w-full mt-4 py-2 text-xs text-[#71717A] hover:text-[#A1A1AA] transition-colors">
              View all {activeSubscriptions.length} subscriptions →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper Components

function LifecycleStep({ label, value, rate, color }: { label: string; value: number; rate: number; color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-[#A1A1AA]">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[#FAFAFA]">{value}</span>
          <span className="text-[10px] text-[#52525B]">({rate.toFixed(1)}%)</span>
        </div>
      </div>
      <div className="h-2 rounded-full bg-[#27272A] overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${rate}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function MetricCard({ label, value, positive, negative }: { label: string; value: string; positive?: boolean; negative?: boolean }) {
  return (
    <div className="p-3 bg-[#27272A]/30 rounded-lg border border-[#3F3F46]">
      <p className="text-[10px] text-[#52525B] mb-1">{label}</p>
      <p className={`text-sm font-bold ${positive ? 'text-[#22C55E]' : negative ? 'text-[#EF4444]' : 'text-[#A1A1AA]'}`}>
        {value}
      </p>
    </div>
  );
}
