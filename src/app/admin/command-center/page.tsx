'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useRequireAuth } from '@/contexts/AuthContext';

interface CommandCenterData {
  timestamp: string;
  realTimeOps: {
    clockedInNow: number;
    clockedInDetails: Array<{
      name: string;
      shop: string;
      since: string;
      onBreak: boolean;
    }>;
    activeWorkOrders: number;
    workOrdersByStatus: Record<string, number>;
    todayWorkOrders: number;
    overdueWorkOrders: number;
    todayAppointments: number;
    noShowsThisWeek: number;
  };
  subscriptionHealth: {
    byPlan: Record<string, number>;
    expiringTrials: Array<{ shop: string; email: string; expiresAt: string }>;
    pastDue: Array<{ shop: string; email: string; plan: string }>;
    cancelledThisMonth: number;
    totalActive: number;
  };
  financials: {
    todayRevenue: number;
    weekRevenue: number;
    pendingPayments: { count: number; amount: number };
  };
  shopHealth: {
    pendingApproval: number;
    pendingShops: Array<any>;
    totalApproved: number;
    activeThisWeek: number;
    inactiveShops: number;
    inactiveList: Array<any>;
  };
  customers: {
    total: number;
    newToday: number;
    newThisWeek: number;
  };
  reviews: {
    averageRating: number;
    totalReviews: number;
    recentBadReviews: Array<any>;
  };
  communication: {
    unreadAdminMessages: number;
    messagesToday: number;
  };
  inventory: {
    lowStockAlerts: number;
    lowStockItems: Array<any>;
  };
  workforce: {
    totalTechs: number;
    activeTechsToday: number;
    totalHoursToday: number;
  };
  serviceBreakdown: Record<string, number>;
  businessMetrics: {
    mrr: number;
    arr: number;
    revenueByPlan: Record<string, { count: number; revenue: number }>;
    newSubsThisMonth: number;
    newSubsLastMonth: number;
    momGrowth: number;
    churnRate: number;
    retentionRate: number;
    totalShopsCreated: number;
    shopsByStatus: Record<string, number>;
    totalActiveSubscriptions: number;
    subscriptionsList: Array<{
      shop: string;
      email: string;
      plan: string;
      status: string;
      startDate: string;
      monthlyRevenue: number;
    }>;
  };
}

export default function CommandCenterPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useRequireAuth(['admin']);
  const [data, setData] = useState<CommandCenterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [activeTab, setActiveTab] = useState('business');


  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found');
        return;
      }
      const res = await fetch('/api/admin/command-center', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!res.ok) throw new Error('Failed to fetch');
      const result = await res.json();
      if (result.success) {
        setData(result);
        setLastUpdate(new Date());
        setError('');
      }
    } catch (err) {
      setError('Failed to load command center data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && user) {
      fetchData();
    }
  }, [authLoading, user, fetchData]);

  useEffect(() => {
    if (!autoRefresh || !user) return;
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, user, fetchData]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSignOut = () => {
    localStorage.clear();
    router.push('/auth/login');
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-orange-500/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-orange-500 animate-spin"></div>
            <div className="absolute inset-3 rounded-full border-4 border-transparent border-t-orange-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}></div>
          </div>
          <p className="text-slate-400 font-medium">Initializing Command Center...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Redirecting to login...</div>
      </div>
    );
  }

  const alertCount = (data?.realTimeOps.overdueWorkOrders || 0) + 
                     (data?.subscriptionHealth.pastDue?.length || 0) + 
                     (data?.shopHealth.pendingApproval || 0) +
                     (data?.communication.unreadAdminMessages || 0);

  const tabs = [
    { id: 'business', label: 'Business', icon: '💰' },
    { id: 'overview', label: 'Overview', icon: '◉' },
    { id: 'operations', label: 'Operations', icon: '⚡' },
    { id: 'shops', label: 'Shops', icon: '▣' },
    { id: 'team', label: 'Team', icon: '◎' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Ambient Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/5 backdrop-blur-xl bg-slate-900/50">
        <div className="max-w-[1920px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/admin/home" className="group flex items-center gap-2 text-slate-400 hover:text-white transition-all">
                <span className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">←</span>
              </Link>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
                    <span className="text-xl">⌘</span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900 animate-pulse"></div>
                </div>
                <div>
                  <h1 className="text-lg font-semibold">Command Center</h1>
                  <p className="text-xs text-slate-500">Real-time platform monitoring</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {alertCount > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  <span className="text-sm text-red-400 font-medium">{alertCount} alerts</span>
                </div>
              )}
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  autoRefresh 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                    : 'bg-white/5 text-slate-400 border border-white/10'
                }`}
              >
                {autoRefresh ? '● Live' : '○ Paused'}
              </button>
              <button
                onClick={fetchData}
                className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all hover:scale-105"
              >
                ↻
              </button>
              <div className="w-px h-8 bg-white/10"></div>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 text-sm font-medium border border-white/10 hover:border-red-500/20 transition-all"
              >
                Sign Out
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-1 mt-4 -mb-4 pb-4">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-t-xl text-sm font-medium transition-all flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-white/10 text-white border-t border-x border-white/10'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                }`}
              >
                <span className="opacity-50">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {error && (
        <div className="relative z-10 max-w-[1920px] mx-auto px-6 pt-6">
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400">
            {error}
          </div>
        </div>
      )}

      <main className="relative z-10 max-w-[1920px] mx-auto px-6 py-6">
        {/* Critical Alerts */}
        {alertCount > 0 && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-red-500/10 via-orange-500/10 to-yellow-500/10 border border-red-500/20 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-red-500/20 flex items-center justify-center text-red-400">!</span>
                <span className="font-semibold">Attention Required</span>
              </div>
              <span className="text-xs text-slate-500">Click to resolve</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {(data?.realTimeOps?.overdueWorkOrders || 0) > 0 && (
                <span className="px-3 py-1.5 rounded-xl bg-red-500/20 text-red-300 text-sm font-medium border border-red-500/20">
                  {data?.realTimeOps?.overdueWorkOrders || 0} Overdue Jobs
                </span>
              )}
              {(data?.subscriptionHealth?.pastDue?.length || 0) > 0 && (
                <span className="px-3 py-1.5 rounded-xl bg-orange-500/20 text-orange-300 text-sm font-medium border border-orange-500/20">
                  {data?.subscriptionHealth?.pastDue?.length || 0} Past Due Payments
                </span>
              )}
              {(data?.shopHealth?.pendingApproval || 0) > 0 && (
                <Link href="/admin/pending-shops" className="px-3 py-1.5 rounded-xl bg-yellow-500/20 text-yellow-300 text-sm font-medium border border-yellow-500/20 hover:bg-yellow-500/30 transition-colors">
                  {data?.shopHealth?.pendingApproval || 0} Pending Approvals →
                </Link>
              )}
              {(data?.communication?.unreadAdminMessages || 0) > 0 && (
                <span className="px-3 py-1.5 rounded-xl bg-blue-500/20 text-blue-300 text-sm font-medium border border-blue-500/20">
                  {data?.communication?.unreadAdminMessages || 0} Unread Messages
                </span>
              )}
            </div>
          </div>
        )}

        {/* ==================== BUSINESS TAB - YOUR APP REVENUE ==================== */}
        {activeTab === 'business' && (
          <>
            {/* MRR/ARR Hero Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="p-8 rounded-2xl bg-gradient-to-br from-emerald-600/20 via-emerald-500/10 to-emerald-400/5 border border-emerald-500/30 backdrop-blur-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl"></div>
                <div className="relative">
                  <div className="flex items-center gap-2 text-emerald-400/70 text-sm mb-2">
                    <span>💵</span> Monthly Recurring Revenue
                  </div>
                  <div className="text-5xl font-bold text-emerald-400 mb-2">
                    {formatCurrency(data?.businessMetrics?.mrr || 0)}
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className={`flex items-center gap-1 ${(data?.businessMetrics?.momGrowth || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {(data?.businessMetrics?.momGrowth || 0) >= 0 ? '↑' : '↓'} {Math.abs(data?.businessMetrics?.momGrowth || 0)}% MoM
                    </span>
                    <span className="text-slate-500">|</span>
                    <span className="text-slate-400">{data?.businessMetrics?.totalActiveSubscriptions || 0} active subs</span>
                  </div>
                </div>
              </div>

              <div className="p-8 rounded-2xl bg-gradient-to-br from-blue-600/20 via-blue-500/10 to-blue-400/5 border border-blue-500/30 backdrop-blur-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>
                <div className="relative">
                  <div className="flex items-center gap-2 text-blue-400/70 text-sm mb-2">
                    <span>📈</span> Annual Recurring Revenue
                  </div>
                  <div className="text-5xl font-bold text-blue-400 mb-2">
                    {formatCurrency(data?.businessMetrics?.arr || 0)}
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-blue-400">Projected yearly revenue</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Key Business Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
              <MetricCard
                label="Total Shops"
                value={data?.businessMetrics?.totalShopsCreated || 0}
                sublabel="registered"
                color="violet"
                icon="🏪"
              />
              <MetricCard
                label="Active Subs"
                value={data?.businessMetrics?.totalActiveSubscriptions || 0}
                sublabel="paying"
                color="emerald"
                icon="✓"
              />
              <MetricCard
                label="New This Month"
                value={data?.businessMetrics?.newSubsThisMonth || 0}
                sublabel="signups"
                color="cyan"
                icon="+"
              />
              <MetricCard
                label="Retention"
                value={`${data?.businessMetrics?.retentionRate || 0}%`}
                sublabel="rate"
                color="green"
                icon="↺"
                isString
              />
              <MetricCard
                label="Churn"
                value={`${data?.businessMetrics?.churnRate || 0}%`}
                sublabel="rate"
                color="orange"
                icon="↓"
                isString
              />
              <MetricCard
                label="Customers"
                value={data?.customers?.total || 0}
                sublabel="total"
                color="blue"
                icon="👥"
              />
            </div>

            {/* Revenue by Plan & Shops Status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <GlassCard title="Revenue by Plan" icon="💎">
                <div className="space-y-4">
                  {data?.businessMetrics?.revenueByPlan && Object.entries(data.businessMetrics.revenueByPlan)
                    .sort((a, b) => b[1].revenue - a[1].revenue)
                    .map(([plan, info]) => {
                      const totalRevenue = Object.values(data.businessMetrics.revenueByPlan).reduce((sum, p) => sum + p.revenue, 0);
                      const percentage = totalRevenue > 0 ? (info.revenue / totalRevenue) * 100 : 0;
                      return (
                        <div key={plan}>
                          <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2">
                              <span className="capitalize font-medium">{plan}</span>
                              <span className="text-xs text-slate-500 bg-white/5 px-2 py-0.5 rounded-full">{info.count} shops</span>
                            </div>
                            <span className="text-lg font-bold text-emerald-400">{formatCurrency(info.revenue)}/mo</span>
                          </div>
                          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  {(!data?.businessMetrics?.revenueByPlan || Object.keys(data.businessMetrics.revenueByPlan).length === 0) && (
                    <div className="text-center py-8 text-slate-500">
                      <span className="text-4xl mb-2 block opacity-20">📊</span>
                      <span>No active subscriptions yet</span>
                    </div>
                  )}
                </div>
              </GlassCard>

              <GlassCard title="Shop Status Breakdown" icon="🏬">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                    <div className="text-4xl font-bold text-emerald-400 mb-1">{data?.businessMetrics?.shopsByStatus?.approved || 0}</div>
                    <div className="text-sm text-emerald-400/70">Approved</div>
                  </div>
                  <div className="p-5 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-center">
                    <div className="text-4xl font-bold text-yellow-400 mb-1">{data?.businessMetrics?.shopsByStatus?.pending || 0}</div>
                    <div className="text-sm text-yellow-400/70">Pending</div>
                  </div>
                  <div className="p-5 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
                    <div className="text-4xl font-bold text-red-400 mb-1">{data?.businessMetrics?.shopsByStatus?.rejected || 0}</div>
                    <div className="text-sm text-red-400/70">Rejected</div>
                  </div>
                  <div className="p-5 rounded-xl bg-slate-500/10 border border-slate-500/20 text-center">
                    <div className="text-4xl font-bold text-slate-400 mb-1">{data?.businessMetrics?.shopsByStatus?.suspended || 0}</div>
                    <div className="text-sm text-slate-400/70">Suspended</div>
                  </div>
                </div>
                <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/5">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Total Shops Created</span>
                    <span className="text-2xl font-bold">{data?.businessMetrics?.totalShopsCreated || 0}</span>
                  </div>
                </div>
              </GlassCard>
            </div>

            {/* Active Subscriptions List */}
            <GlassCard title="Active Subscriptions" icon="📋" badge={data?.businessMetrics?.totalActiveSubscriptions || 0}>
              {data?.businessMetrics?.subscriptionsList && data.businessMetrics.subscriptionsList.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-xs text-slate-500 border-b border-white/5">
                        <th className="pb-3 font-medium">Shop</th>
                        <th className="pb-3 font-medium">Email</th>
                        <th className="pb-3 font-medium">Plan</th>
                        <th className="pb-3 font-medium">Status</th>
                        <th className="pb-3 font-medium text-right">Monthly</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {data.businessMetrics.subscriptionsList.map((sub, i) => (
                        <tr key={i} className="hover:bg-white/5 transition-colors">
                          <td className="py-3 font-medium">{sub.shop || 'Unknown Shop'}</td>
                          <td className="py-3 text-slate-400 text-sm">{sub.email || '-'}</td>
                          <td className="py-3">
                            <span className="px-2 py-1 rounded-lg bg-orange-500/20 text-orange-400 text-xs capitalize font-medium">
                              {sub.plan}
                            </span>
                          </td>
                          <td className="py-3">
                            <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                              sub.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' :
                              sub.status === 'trialing' ? 'bg-blue-500/20 text-blue-400' :
                              'bg-slate-500/20 text-slate-400'
                            }`}>
                              {sub.status}
                            </span>
                          </td>
                          <td className="py-3 text-right font-semibold text-emerald-400">
                            {formatCurrency(sub.monthlyRevenue)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  <span className="text-5xl mb-3 block opacity-20">📭</span>
                  <span className="block mb-2">No active subscriptions yet</span>
                  <span className="text-xs text-slate-600">When shops subscribe to plans, they&apos;ll appear here</span>
                </div>
              )}
            </GlassCard>

            {/* Quick Actions for Business */}
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/admin/pending-shops" className="px-4 py-2 rounded-xl bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 text-sm font-medium border border-yellow-500/20 transition-all">
                Review Pending Shops ({data?.shopHealth?.pendingApproval || 0})
              </Link>
              <Link href="/admin/revenue" className="px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-sm font-medium border border-emerald-500/20 transition-all">
                Revenue Details →
              </Link>
              <a href="https://dashboard.stripe.com" target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-xl bg-violet-500/20 hover:bg-violet-500/30 text-violet-400 text-sm font-medium border border-violet-500/20 transition-all">
                Open Stripe Dashboard ↗
              </a>
            </div>
          </>
        )}

        {activeTab === 'overview' && (
          <>
            {/* Key Metrics Row */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
              <MetricCard
                label="Active Now"
                value={data?.realTimeOps.clockedInNow || 0}
                sublabel="employees"
                color="emerald"
                icon="●"
                pulse
              />
              <MetricCard
                label="Live Jobs"
                value={data?.realTimeOps.activeWorkOrders || 0}
                sublabel="in progress"
                color="blue"
                icon="◆"
              />
              <MetricCard
                label="Today's Jobs"
                value={data?.realTimeOps.todayWorkOrders || 0}
                sublabel="created"
                color="violet"
                icon="▲"
              />
              <MetricCard
                label="Revenue Today"
                value={formatCurrency(data?.financials.todayRevenue || 0)}
                sublabel="collected"
                color="green"
                icon="$"
                isString
              />
              <MetricCard
                label="Appointments"
                value={data?.realTimeOps.todayAppointments || 0}
                sublabel="scheduled"
                color="orange"
                icon="◇"
              />
              <MetricCard
                label="New Customers"
                value={data?.customers.newToday || 0}
                sublabel="signed up"
                color="cyan"
                icon="+"
              />
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {/* Work Order Pipeline */}
              <div className="lg:col-span-1">
                <GlassCard title="Work Order Pipeline" icon="◉">
                  <div className="space-y-3">
                    {data?.realTimeOps.workOrdersByStatus && Object.entries(data.realTimeOps.workOrdersByStatus).map(([status, count]) => (
                      <StatusBar key={status} status={status} count={count} total={Object.values(data.realTimeOps.workOrdersByStatus).reduce((a, b) => a + b, 0)} />
                    ))}
                  </div>
                </GlassCard>
              </div>

              {/* Subscription Distribution */}
              <div className="lg:col-span-1">
                <GlassCard title="Subscriptions" icon="◈">
                  <div className="grid grid-cols-2 gap-3">
                    {data?.subscriptionHealth.byPlan && Object.entries(data.subscriptionHealth.byPlan).map(([plan, count]) => (
                      <div key={plan} className="p-3 rounded-xl bg-white/5 border border-white/5">
                        <div className="text-2xl font-bold">{count}</div>
                        <div className="text-xs text-slate-500 capitalize">{plan}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
                    <span className="text-slate-500 text-sm">Total Active</span>
                    <span className="text-xl font-bold text-emerald-400">{data?.subscriptionHealth.totalActive || 0}</span>
                  </div>
                </GlassCard>
              </div>

              {/* Financial Quick View */}
              <div className="lg:col-span-1">
                <GlassCard title="Revenue" icon="$">
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20">
                      <div className="text-sm text-emerald-400/70 mb-1">Today</div>
                      <div className="text-3xl font-bold text-emerald-400">{formatCurrency(data?.financials.todayRevenue || 0)}</div>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-1 p-3 rounded-xl bg-white/5 border border-white/5">
                        <div className="text-xs text-slate-500 mb-1">This Week</div>
                        <div className="text-lg font-semibold">{formatCurrency(data?.financials.weekRevenue || 0)}</div>
                      </div>
                      <div className="flex-1 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                        <div className="text-xs text-yellow-400/70 mb-1">Pending</div>
                        <div className="text-lg font-semibold text-yellow-400">{formatCurrency(data?.financials.pendingPayments.amount || 0)}</div>
                      </div>
                    </div>
                  </div>
                  <Link href="/admin/revenue" className="mt-4 flex items-center justify-center gap-2 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-sm text-slate-400 hover:text-white transition-all">
                    View Details <span>→</span>
                  </Link>
                </GlassCard>
              </div>
            </div>

            {/* Secondary Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Active Employees */}
              <GlassCard title="Currently Working" icon="●" badge={data?.realTimeOps.clockedInNow || 0}>
                {data?.realTimeOps.clockedInDetails && data.realTimeOps.clockedInDetails.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                    {data.realTimeOps.clockedInDetails.map((emp, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                            <span className="text-emerald-400 font-semibold">{emp.name.charAt(0)}</span>
                          </div>
                          <div>
                            <div className="font-medium">{emp.name}</div>
                            <div className="text-xs text-slate-500">{emp.shop}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-slate-400">Since {formatTime(emp.since)}</div>
                          {emp.onBreak && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400">Break</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                    <span className="text-4xl mb-2 opacity-20">◎</span>
                    <span>No active employees</span>
                  </div>
                )}
              </GlassCard>

              {/* Shop Health */}
              <GlassCard title="Shop Health" icon="▣">
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                    <div className="text-3xl font-bold">{data?.shopHealth.totalApproved || 0}</div>
                    <div className="text-xs text-slate-500">Total Shops</div>
                  </div>
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <div className="text-3xl font-bold text-emerald-400">{data?.shopHealth.activeThisWeek || 0}</div>
                    <div className="text-xs text-emerald-400/70">Active This Week</div>
                  </div>
                  <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                    <div className="text-3xl font-bold text-yellow-400">{data?.shopHealth.pendingApproval || 0}</div>
                    <div className="text-xs text-yellow-400/70">Pending Approval</div>
                  </div>
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                    <div className="text-3xl font-bold text-red-400">{data?.shopHealth.inactiveShops || 0}</div>
                    <div className="text-xs text-red-400/70">Inactive (30d)</div>
                  </div>
                </div>
                {data?.shopHealth.inactiveList && data.shopHealth.inactiveList.length > 0 && (
                  <div className="pt-3 border-t border-white/5">
                    <div className="text-xs text-slate-500 mb-2">Inactive shops needing outreach:</div>
                    <div className="flex flex-wrap gap-2">
                      {data.shopHealth.inactiveList.slice(0, 5).map((shop: any, i: number) => (
                        <span key={i} className="px-2 py-1 rounded-lg bg-red-500/10 text-red-400 text-xs">{shop.shopName}</span>
                      ))}
                    </div>
                  </div>
                )}
              </GlassCard>
            </div>
          </>
        )}

        {activeTab === 'operations' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GlassCard title="Work Order Status" icon="◉">
              <div className="space-y-4">
                {data?.realTimeOps.workOrdersByStatus && Object.entries(data.realTimeOps.workOrdersByStatus).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                    <div className="flex items-center gap-3">
                      <StatusDot status={status} />
                      <span className="capitalize font-medium">{status.replace('-', ' ')}</span>
                    </div>
                    <span className="text-2xl font-bold">{count}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-between">
                <span className="text-red-400">Overdue Work Orders</span>
                <span className="text-2xl font-bold text-red-400">{data?.realTimeOps.overdueWorkOrders || 0}</span>
              </div>
            </GlassCard>

            <GlassCard title="Service Types" icon="◆">
              <div className="space-y-4">
                {data?.serviceBreakdown && Object.entries(data.serviceBreakdown).map(([type, count]) => {
                  const total = Object.values(data.serviceBreakdown).reduce((a, b) => a + b, 0);
                  const percentage = total > 0 ? (count / total) * 100 : 0;
                  return (
                    <div key={type}>
                      <div className="flex justify-between mb-2">
                        <span className="capitalize text-slate-300">{type}</span>
                        <span className="font-semibold">{count}</span>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </GlassCard>

            <GlassCard title="Appointments" icon="◇">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-6 rounded-xl bg-gradient-to-br from-orange-500/10 to-orange-500/5 border border-orange-500/20 text-center">
                  <div className="text-4xl font-bold text-orange-400 mb-1">{data?.realTimeOps.todayAppointments || 0}</div>
                  <div className="text-sm text-orange-400/70">Scheduled Today</div>
                </div>
                <div className="p-6 rounded-xl bg-gradient-to-br from-red-500/10 to-red-500/5 border border-red-500/20 text-center">
                  <div className="text-4xl font-bold text-red-400 mb-1">{data?.realTimeOps.noShowsThisWeek || 0}</div>
                  <div className="text-sm text-red-400/70">No-Shows (Week)</div>
                </div>
              </div>
            </GlassCard>

            <GlassCard title="Customer Feedback" icon="★">
              <div className="flex items-center gap-6 mb-6">
                <div className="text-center">
                  <div className="text-5xl font-bold text-yellow-400">{data?.reviews.averageRating || 0}</div>
                  <div className="text-yellow-400 mt-1">{'★'.repeat(Math.round(data?.reviews.averageRating || 0))}</div>
                </div>
                <div className="flex-1">
                  <div className="text-slate-500 text-sm">Based on</div>
                  <div className="text-2xl font-semibold">{data?.reviews.totalReviews || 0} reviews</div>
                </div>
              </div>
              {data?.reviews.recentBadReviews && data.reviews.recentBadReviews.length > 0 && (
                <div className="pt-4 border-t border-white/5">
                  <div className="text-xs text-red-400 mb-3">⚠ Recent Low Ratings</div>
                  <div className="space-y-2">
                    {data.reviews.recentBadReviews.slice(0, 3).map((review: any, i: number) => (
                      <div key={i} className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                        <div className="flex justify-between mb-1">
                          <span className="text-red-400 text-sm">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                          <span className="text-xs text-slate-500">{review.shop}</span>
                        </div>
                        {review.comment && <div className="text-xs text-slate-400 truncate">{review.comment}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </GlassCard>
          </div>
        )}

        {activeTab === 'shops' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GlassCard title="Shop Overview" icon="▣">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-6 rounded-xl bg-white/5 border border-white/5 text-center">
                  <div className="text-4xl font-bold mb-1">{data?.shopHealth.totalApproved || 0}</div>
                  <div className="text-sm text-slate-500">Total Shops</div>
                </div>
                <div className="p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                  <div className="text-4xl font-bold text-emerald-400 mb-1">{data?.shopHealth.activeThisWeek || 0}</div>
                  <div className="text-sm text-emerald-400/70">Active</div>
                </div>
                <div className="p-6 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-center">
                  <div className="text-4xl font-bold text-yellow-400 mb-1">{data?.shopHealth.pendingApproval || 0}</div>
                  <div className="text-sm text-yellow-400/70">Pending</div>
                </div>
                <div className="p-6 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
                  <div className="text-4xl font-bold text-red-400 mb-1">{data?.shopHealth.inactiveShops || 0}</div>
                  <div className="text-sm text-red-400/70">Inactive</div>
                </div>
              </div>
            </GlassCard>

            <GlassCard title="Pending Approvals" icon="⏳">
              {data?.shopHealth.pendingShops && data.shopHealth.pendingShops.length > 0 ? (
                <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
                  {data.shopHealth.pendingShops.map((shop: any, i: number) => (
                    <div key={i} className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-medium">{shop.shopName || 'Unnamed Shop'}</div>
                        <span className="text-xs text-yellow-400">{shop.shopType}</span>
                      </div>
                      <div className="text-sm text-slate-500">{shop.ownerName}</div>
                      <div className="text-xs text-slate-600">{shop.email}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                  <span className="text-4xl mb-2 opacity-20">✓</span>
                  <span>No pending approvals</span>
                </div>
              )}
              {(data?.shopHealth?.pendingApproval || 0) > 0 && (
                <Link href="/admin/pending-shops" className="mt-4 flex items-center justify-center gap-2 py-3 rounded-xl bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 font-medium transition-all">
                  Review Approvals →
                </Link>
              )}
            </GlassCard>

            <GlassCard title="Inactive Shops" icon="⚠" className="lg:col-span-2">
              {data?.shopHealth.inactiveList && data.shopHealth.inactiveList.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {data.shopHealth.inactiveList.map((shop: any, i: number) => (
                    <div key={i} className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                      <div className="font-medium text-red-400">{shop.shopName}</div>
                      <div className="text-xs text-slate-500 mt-1">{shop.email}</div>
                      <div className="text-xs text-red-400/50 mt-2">No activity in 30+ days</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                  <span className="text-4xl mb-2 opacity-20">✓</span>
                  <span>All shops are active</span>
                </div>
              )}
            </GlassCard>
          </div>
        )}

        {activeTab === 'team' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <GlassCard title="Workforce Stats" icon="◎">
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center">
                  <span className="text-slate-400">Total Technicians</span>
                  <span className="text-2xl font-bold">{data?.workforce.totalTechs || 0}</span>
                </div>
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex justify-between items-center">
                  <span className="text-emerald-400">Active Today</span>
                  <span className="text-2xl font-bold text-emerald-400">{data?.workforce.activeTechsToday || 0}</span>
                </div>
                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex justify-between items-center">
                  <span className="text-blue-400">Hours Worked Today</span>
                  <span className="text-2xl font-bold text-blue-400">{data?.workforce.totalHoursToday || 0}h</span>
                </div>
              </div>
            </GlassCard>

            <GlassCard title="Currently Working" icon="●" className="lg:col-span-2" badge={data?.realTimeOps.clockedInNow || 0}>
              {data?.realTimeOps.clockedInDetails && data.realTimeOps.clockedInDetails.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto custom-scrollbar">
                  {data.realTimeOps.clockedInDetails.map((emp, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                        <span className="text-lg text-emerald-400 font-semibold">{emp.name.charAt(0)}</span>
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{emp.name}</div>
                        <div className="text-xs text-slate-500">{emp.shop}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-slate-400">{formatTime(emp.since)}</div>
                        {emp.onBreak && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400">Break</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                  <span className="text-5xl mb-3 opacity-20">◎</span>
                  <span>No active employees</span>
                </div>
              )}
            </GlassCard>

            <GlassCard title="Customers" icon="◆" className="lg:col-span-3">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-6 rounded-xl bg-white/5 border border-white/5 text-center">
                  <div className="text-4xl font-bold mb-1">{data?.customers.total || 0}</div>
                  <div className="text-sm text-slate-500">Total Customers</div>
                </div>
                <div className="p-6 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-center">
                  <div className="text-4xl font-bold text-cyan-400 mb-1">{data?.customers.newToday || 0}</div>
                  <div className="text-sm text-cyan-400/70">New Today</div>
                </div>
                <div className="p-6 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
                  <div className="text-4xl font-bold text-blue-400 mb-1">{data?.customers.newThisWeek || 0}</div>
                  <div className="text-sm text-blue-400/70">This Week</div>
                </div>
              </div>
            </GlassCard>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 flex items-center justify-between text-xs text-slate-600">
          <div>Last updated: {lastUpdate?.toLocaleString()}</div>
          <div className="flex items-center gap-4">
            <Link href="/admin/home" className="hover:text-slate-400 transition-colors">Dashboard</Link>
            <Link href="/admin/revenue" className="hover:text-slate-400 transition-colors">Revenue</Link>
            <a href="https://dashboard.stripe.com" target="_blank" rel="noopener noreferrer" className="hover:text-slate-400 transition-colors">Stripe</a>
          </div>
        </div>
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.2);
        }
      `}</style>
    </div>
  );
}

function MetricCard({ label, value, sublabel, color, icon, pulse, isString }: {
  label: string;
  value: number | string;
  sublabel: string;
  color: string;
  icon: string;
  pulse?: boolean;
  isString?: boolean;
}) {
  const colors: Record<string, string> = {
    emerald: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/20 text-emerald-400',
    blue: 'from-blue-500/20 to-blue-500/5 border-blue-500/20 text-blue-400',
    violet: 'from-violet-500/20 to-violet-500/5 border-violet-500/20 text-violet-400',
    green: 'from-green-500/20 to-green-500/5 border-green-500/20 text-green-400',
    orange: 'from-orange-500/20 to-orange-500/5 border-orange-500/20 text-orange-400',
    cyan: 'from-cyan-500/20 to-cyan-500/5 border-cyan-500/20 text-cyan-400',
  };

  return (
    <div className={`relative p-4 rounded-2xl bg-gradient-to-br ${colors[color]} border backdrop-blur-sm overflow-hidden`}>
      {pulse && (
        <div className="absolute top-3 right-3 w-2 h-2 bg-current rounded-full animate-pulse"></div>
      )}
      <div className="text-xs text-slate-400 mb-1 flex items-center gap-1">
        <span className="opacity-50">{icon}</span>
        {label}
      </div>
      <div className={`text-2xl font-bold ${isString ? '' : ''}`}>{value}</div>
      <div className="text-xs text-slate-500">{sublabel}</div>
    </div>
  );
}

function GlassCard({ title, icon, children, badge, className = '' }: {
  title: string;
  icon: string;
  children: React.ReactNode;
  badge?: number;
  className?: string;
}) {
  return (
    <div className={`p-5 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-sm ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-400">{icon}</span>
          <h3 className="font-semibold text-slate-200">{title}</h3>
        </div>
        {badge !== undefined && (
          <span className="px-2 py-1 rounded-lg bg-white/5 text-xs font-medium text-slate-400">{badge}</span>
        )}
      </div>
      {children}
    </div>
  );
}

function StatusBar({ status, count, total }: { status: string; count: number; total: number }) {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  const colors: Record<string, string> = {
    pending: 'bg-yellow-500',
    'in-progress': 'bg-blue-500',
    completed: 'bg-emerald-500',
    cancelled: 'bg-red-500',
    'on-hold': 'bg-purple-500',
  };

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="capitalize text-slate-400">{status.replace('-', ' ')}</span>
        <span className="font-medium">{count}</span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-500 ${colors[status] || 'bg-slate-500'}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-500',
    'in-progress': 'bg-blue-500',
    completed: 'bg-emerald-500',
    cancelled: 'bg-red-500',
    'on-hold': 'bg-purple-500',
  };

  return (
    <span className={`w-3 h-3 rounded-full ${colors[status] || 'bg-slate-500'}`}></span>
  );
}
