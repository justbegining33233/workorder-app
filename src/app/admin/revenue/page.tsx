'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useRequireAuth } from '@/contexts/AuthContext';

interface RevenueData {
  mrr: number;
  arr: number;
  totalActiveSubscriptions: number;
  planBreakdown: Record<string, { count: number; revenue: number }>;
  recentPayments: Array<{
    id: string;
    shopName: string;
    amount: number;
    status: string;
    date: string;
  }>;
  totals: {
    grossRevenue: number;
    estimatedStripeFees: number;
    netRevenue: number;
  };
}

interface LiveMetrics {
  revenueTrend: number[];
  momGrowth: string;
  yoyGrowth: string;
  churnRate: string;
  retentionRate: string;
  conversionRate: string;
  arpu: number;
  ltv: number;
  avgLifetimeMonths: number;
  newSubsThisMonth: number;
  activeSubscriptions: number;
  trialingSubscriptions: number;
  canceledSubscriptions: number;
  revenueThisMonth: number;
  revenueLastMonth: number;
  revenueLast3Months: number;
}

interface StripeLinks {
  dashboard: string;
  payments: string;
  subscriptions: string;
  payouts: string;
  balances: string;
}

// Mini chart component
function MiniLineChart({ data, color, height = 40 }: { data: number[]; color: string; height?: number }) {
  if (!data || data.length === 0) return null;
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
        <linearGradient id={`rev-gradient-${color.replace('#', '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline fill="none" stroke={color} strokeWidth="2" points={points} strokeLinecap="round" strokeLinejoin="round" />
      <polygon fill={`url(#rev-gradient-${color.replace('#', '')})`} points={`0,${height} ${points} ${width},${height}`} />
    </svg>
  );
}

export default function AdminRevenuePage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useRequireAuth(['admin']);
  const [loading, setLoading] = useState(true);
  const [revenue, setRevenue] = useState<RevenueData | null>(null);
  const [liveMetrics, setLiveMetrics] = useState<LiveMetrics | null>(null);
  const [stripeLinks, setStripeLinks] = useState<StripeLinks | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && user) {
      fetchRevenueData();
      
      // Auto-refresh every 2 minutes
      const interval = setInterval(() => {
        fetchRevenueData();
      }, 2 * 60 * 1000);
      
      return () => clearInterval(interval);
    }
  }, [authLoading, user]);

  const fetchRevenueData = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/revenue', {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.status === 401 || res.status === 403) {
        router.push('/auth/login');
        return;
      }
      const data = await res.json();
      if (data.success) {
        setRevenue(data.revenue);
        setLiveMetrics(data.liveMetrics);
        setStripeLinks(data.stripeLinks);
      } else {
        setError(data.error || 'Failed to load revenue data');
      }
    } catch (err) {
      setError('Failed to fetch revenue data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const planColors: Record<string, string> = {
    starter: 'bg-gray-500',
    growth: 'bg-blue-500',
    professional: 'bg-purple-500',
    business: 'bg-orange-500',
    enterprise: 'bg-red-500'
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-slate-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center">
        <div className="bg-[#111827] border border-[#1f2937] rounded-lg px-6 py-4 text-slate-400 text-sm">
          Redirecting to login...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090B] text-slate-100">
      {/* Header */}
      <header className="bg-[#0f172a] border-b border-[#1f2937] px-5 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/admin/home"
              className="text-slate-400 hover:text-slate-100 transition-colors text-sm"
            >
              ← Back to Dashboard
            </Link>
            <h1 className="text-2xl font-semibold text-slate-100">💰 Revenue & Payouts</h1>
          </div>
          <a
            href={stripeLinks?.dashboard || 'https://dashboard.stripe.com'}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#635BFF] hover:bg-[#5851ea] text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/>
            </svg>
            Open Stripe Dashboard
          </a>
        </div>
      </header>

      <main className="px-5 py-8 max-w-7xl mx-auto">
        {error && (
          <div className="bg-red-500/10 border border-red-500/40 text-red-300 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Revenue Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-slate-900/70 to-slate-900 border border-[#1f2937] rounded-2xl p-6 shadow-lg shadow-black/30">
            <div className="flex items-center justify-between mb-2">
              <div className="text-slate-400 text-sm">Monthly Recurring Revenue</div>
              {liveMetrics && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  liveMetrics.momGrowth.startsWith('+') ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {liveMetrics.momGrowth}
                </span>
              )}
            </div>
            <div className="text-3xl font-bold text-green-400">
              {formatCurrency(revenue?.mrr || 0)}
            </div>
            <div className="text-slate-500 text-sm mt-1">MRR</div>
            {liveMetrics && <MiniLineChart data={liveMetrics.revenueTrend} color="#22C55E" height={35} />}
          </div>

          <div className="bg-gradient-to-br from-slate-900/70 to-slate-900 border border-[#1f2937] rounded-2xl p-6 shadow-lg shadow-black/30">
            <div className="flex items-center justify-between mb-2">
              <div className="text-slate-400 text-sm">Annual Recurring Revenue</div>
              {liveMetrics && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  liveMetrics.yoyGrowth.startsWith('+') ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {liveMetrics.yoyGrowth}
                </span>
              )}
            </div>
            <div className="text-3xl font-bold text-blue-400">
              {formatCurrency(revenue?.arr || 0)}
            </div>
            <div className="text-slate-500 text-sm mt-1">ARR (projected)</div>
          </div>

          <div className="bg-gradient-to-br from-slate-900/70 to-slate-900 border border-[#1f2937] rounded-2xl p-6 shadow-lg shadow-black/30">
            <div className="text-slate-400 text-sm mb-1">Active Subscriptions</div>
            <div className="text-3xl font-bold text-orange-400">
              {liveMetrics?.activeSubscriptions || revenue?.totalActiveSubscriptions || 0}
            </div>
            <div className="text-slate-500 text-sm mt-1">
              {liveMetrics?.trialingSubscriptions || 0} in trial
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-900/70 to-slate-900 border border-[#1f2937] rounded-2xl p-6 shadow-lg shadow-black/30">
            <div className="text-slate-400 text-sm mb-1">Net Revenue (after fees)</div>
            <div className="text-3xl font-bold text-purple-400">
              {formatCurrency(revenue?.totals.netRevenue || 0)}
            </div>
            <div className="text-slate-500 text-sm mt-1">Your earnings</div>
          </div>
        </div>

        {/* NEW: Key Metrics Row */}
        {liveMetrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
            <div className="bg-[#0f172a] border border-[#1f2937] rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{liveMetrics.retentionRate}</div>
              <div className="text-slate-400 text-xs">Retention Rate</div>
            </div>
            <div className="bg-[#0f172a] border border-[#1f2937] rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold text-red-400">{liveMetrics.churnRate}</div>
              <div className="text-slate-400 text-xs">Churn Rate</div>
            </div>
            <div className="bg-[#0f172a] border border-[#1f2937] rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">{liveMetrics.conversionRate}</div>
              <div className="text-slate-400 text-xs">Trial → Paid</div>
            </div>
            <div className="bg-[#0f172a] border border-[#1f2937] rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold text-purple-400">{formatCurrency(liveMetrics.arpu)}</div>
              <div className="text-slate-400 text-xs">ARPU</div>
            </div>
            <div className="bg-[#0f172a] border border-[#1f2937] rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold text-orange-400">{formatCurrency(liveMetrics.ltv)}</div>
              <div className="text-slate-400 text-xs">Lifetime Value</div>
            </div>
            <div className="bg-[#0f172a] border border-[#1f2937] rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold text-cyan-400">{liveMetrics.avgLifetimeMonths} mo</div>
              <div className="text-slate-400 text-xs">Avg Lifetime</div>
            </div>
          </div>
        )}

        {/* NEW: Subscription Status Cards */}
        {liveMetrics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-[#0f172a] border border-[#1f2937] rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-slate-400 text-sm">New This Month</div>
                  <div className="text-2xl font-bold text-green-400">{liveMetrics.newSubsThisMonth}</div>
                </div>
                <div className="w-10 h-10 bg-green-500/15 rounded-lg flex items-center justify-center">
                  <span className="text-xl">📈</span>
                </div>
              </div>
            </div>
            <div className="bg-[#0f172a] border border-[#1f2937] rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-slate-400 text-sm">In Trial</div>
                  <div className="text-2xl font-bold text-yellow-400">{liveMetrics.trialingSubscriptions}</div>
                </div>
                <div className="w-10 h-10 bg-yellow-500/15 rounded-lg flex items-center justify-center">
                  <span className="text-xl">⏳</span>
                </div>
              </div>
            </div>
            <div className="bg-[#0f172a] border border-[#1f2937] rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-slate-400 text-sm">Active</div>
                  <div className="text-2xl font-bold text-blue-400">{liveMetrics.activeSubscriptions}</div>
                </div>
                <div className="w-10 h-10 bg-blue-500/15 rounded-lg flex items-center justify-center">
                  <span className="text-xl">✅</span>
                </div>
              </div>
            </div>
            <div className="bg-[#0f172a] border border-[#1f2937] rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-slate-400 text-sm">Canceled</div>
                  <div className="text-2xl font-bold text-red-400">{liveMetrics.canceledSubscriptions}</div>
                </div>
                <div className="w-10 h-10 bg-red-500/15 rounded-lg flex items-center justify-center">
                  <span className="text-xl">❌</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* NEW: Revenue by Period */}
        {liveMetrics && (
          <div className="bg-[#0f172a] border border-[#1f2937] rounded-2xl p-6 mb-8 shadow-lg shadow-black/30">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="text-green-400">📊</span> Revenue by Period (Work Orders)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-[#111827]/70 border border-[#1f2937] rounded-xl">
                <div className="text-3xl font-bold text-green-400">{formatCurrency(liveMetrics.revenueThisMonth)}</div>
                <div className="text-slate-400 text-sm mt-1">This Month</div>
              </div>
              <div className="text-center p-4 bg-[#111827]/70 border border-[#1f2937] rounded-xl">
                <div className="text-3xl font-bold text-blue-400">{formatCurrency(liveMetrics.revenueLastMonth)}</div>
                <div className="text-slate-400 text-sm mt-1">Last Month</div>
              </div>
              <div className="text-center p-4 bg-[#111827]/70 border border-[#1f2937] rounded-xl">
                <div className="text-3xl font-bold text-purple-400">{formatCurrency(liveMetrics.revenueLast3Months)}</div>
                <div className="text-slate-400 text-sm mt-1">Last 3 Months</div>
              </div>
            </div>
          </div>
        )}

        {/* Stripe Quick Links */}
        <div className="bg-[#0f172a] border border-[#1f2937] rounded-2xl p-6 mb-8 shadow-lg shadow-black/30">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="text-[#635BFF]">💳</span> Stripe Quick Actions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <a
              href={stripeLinks?.payouts || 'https://dashboard.stripe.com/payouts'}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#111827] hover:bg-[#0f172a] border border-[#1f2937] rounded-xl p-4 text-center transition-colors"
            >
              <div className="text-2xl mb-2">🏦</div>
              <div className="font-medium">Payouts</div>
              <div className="text-slate-400 text-sm">View bank transfers</div>
            </a>
            <a
              href={stripeLinks?.balances || 'https://dashboard.stripe.com/balance/overview'}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#111827] hover:bg-[#0f172a] border border-[#1f2937] rounded-xl p-4 text-center transition-colors"
            >
              <div className="text-2xl mb-2">💵</div>
              <div className="font-medium">Balance</div>
              <div className="text-slate-400 text-sm">Available funds</div>
            </a>
            <a
              href={stripeLinks?.payments || 'https://dashboard.stripe.com/payments'}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#111827] hover:bg-[#0f172a] border border-[#1f2937] rounded-xl p-4 text-center transition-colors"
            >
              <div className="text-2xl mb-2">💳</div>
              <div className="font-medium">Payments</div>
              <div className="text-slate-400 text-sm">Transaction history</div>
            </a>
            <a
              href={stripeLinks?.subscriptions || 'https://dashboard.stripe.com/subscriptions'}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#111827] hover:bg-[#0f172a] border border-[#1f2937] rounded-xl p-4 text-center transition-colors"
            >
              <div className="text-2xl mb-2">🔄</div>
              <div className="font-medium">Subscriptions</div>
              <div className="text-slate-400 text-sm">Manage recurring</div>
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Plan Breakdown */}
          <div className="bg-[#0f172a] border border-[#1f2937] rounded-2xl p-6 shadow-lg shadow-black/30">
            <h2 className="text-lg font-semibold mb-4">📊 Revenue by Plan</h2>
            {revenue?.planBreakdown && Object.keys(revenue.planBreakdown).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(revenue.planBreakdown).map(([plan, data]) => (
                  <div key={plan} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${planColors[plan] || 'bg-gray-500'}`}></div>
                      <div>
                        <div className="font-medium capitalize">{plan}</div>
                        <div className="text-slate-400 text-sm">{data.count} subscriber{data.count !== 1 ? 's' : ''}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-green-400">{formatCurrency(data.revenue)}/mo</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-slate-500 text-center py-8">
                No active subscriptions yet
              </div>
            )}
          </div>

          {/* Recent Payments */}
          <div className="bg-[#0f172a] border border-[#1f2937] rounded-2xl p-6 shadow-lg shadow-black/30">
            <h2 className="text-lg font-semibold mb-4">💸 Recent Payments</h2>
            {revenue?.recentPayments && revenue.recentPayments.length > 0 ? (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {revenue.recentPayments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between py-2 border-b border-[#1f2937] last:border-0">
                    <div>
                      <div className="font-medium">{payment.shopName}</div>
                      <div className="text-slate-400 text-sm">{formatDate(payment.date)}</div>
                    </div>
                    <div className="text-right">
                      <div className={`font-medium ${payment.status === 'succeeded' ? 'text-green-400' : 'text-yellow-400'}`}>
                        {formatCurrency(payment.amount)}
                      </div>
                      <div className={`text-xs px-2 py-0.5 rounded-full inline-block ${
                        payment.status === 'succeeded' 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {payment.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-slate-500 text-center py-8">
                No payments recorded yet
              </div>
            )}
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-gradient-to-br from-slate-900/70 via-[#0f172a] to-[#0b1220] border border-[#1f2937] rounded-2xl p-6 mt-8 shadow-lg shadow-black/30">
          <h2 className="text-lg font-semibold mb-4">🎯 How You Get Paid</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-slate-800/70 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-2xl">1️⃣</span>
              </div>
              <div className="font-medium">Shop Subscribes</div>
              <div className="text-slate-400 text-sm">Shops choose a plan</div>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-slate-800/70 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-2xl">2️⃣</span>
              </div>
              <div className="font-medium">Stripe Collects</div>
              <div className="text-slate-400 text-sm">Secure payment processing</div>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-slate-800/70 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-2xl">3️⃣</span>
              </div>
              <div className="font-medium">Fees Deducted</div>
              <div className="text-slate-400 text-sm">~2.9% + $0.30 per txn</div>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-2xl">4️⃣</span>
              </div>
              <div className="font-medium">You Get Paid</div>
              <div className="text-slate-400 text-sm">Deposited to your bank</div>
            </div>
          </div>
          <div className="mt-4 p-4 bg-[#111827]/60 border border-[#1f2937] rounded-xl">
            <p className="text-slate-300 text-sm">
              <strong>⚡ Setup Required:</strong> Go to <a href="https://dashboard.stripe.com/settings/payouts" target="_blank" rel="noopener noreferrer" className="text-emerald-300 hover:underline">Stripe Dashboard → Settings → Payouts</a> to connect your bank account and set your payout schedule (daily, weekly, or monthly).
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
