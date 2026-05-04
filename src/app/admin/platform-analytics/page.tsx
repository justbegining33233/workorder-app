'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';

// Dynamically import heavy chart components
const DynamicRevenueChart = dynamic(() => import('@/components/AnalyticsCharts').then(mod => ({ default: mod.RevenueChart })), {
  loading: () => <div className="h-64 flex items-center justify-center text-gray-400">Loading chart...</div>
});
const DynamicCompletionTimesChart = dynamic(() => import('@/components/AnalyticsCharts').then(mod => ({ default: mod.CompletionTimesChart })), {
  loading: () => <div className="h-64 flex items-center justify-center text-gray-400">Loading chart...</div>
});
const DynamicTechPerformanceChart = dynamic(() => import('@/components/AnalyticsCharts').then(mod => ({ default: mod.TechPerformanceChart })), {
  loading: () => <div className="h-64 flex items-center justify-center text-gray-400">Loading chart...</div>
});
const DynamicStatusDistributionChart = dynamic(() => import('@/components/AnalyticsCharts').then(mod => ({ default: mod.StatusDistributionChart })), {
  loading: () => <div className="h-64 flex items-center justify-center text-gray-400">Loading chart...</div>
});
const DynamicMonthlyTrendsChart = dynamic(() => import('@/components/AnalyticsCharts').then(mod => ({ default: mod.MonthlyTrendsChart })), {
  loading: () => <div className="h-64 flex items-center justify-center text-gray-400">Loading chart...</div>
});
import { FaArrowDown, FaArrowLeft, FaArrowUp, FaChartBar } from 'react-icons/fa';
import { useRequireAuth } from '@/contexts/AuthContext';

export default function PlatformAnalytics() {
  const { user, isLoading } = useRequireAuth(['admin']);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#e5e7eb',
        fontSize: '18px'
      }}>
        Loading...
      </div>
    );
  }

  // If no user, the useRequireAuth hook will handle redirect
  if (!user) {
    return null;
  }

  // Mock analytics data - in a real app this would come from an API
  const analyticsData = {
    revenue: [
      { month: 'Jan', amount: 12000 },
      { month: 'Feb', amount: 15000 },
      { month: 'Mar', amount: 18000 },
      { month: 'Apr', amount: 22000 },
      { month: 'May', amount: 25000 },
      { month: 'Jun', amount: 28000 },
    ],
    completionTimes: [
      { time: '0-2h', count: 45 },
      { time: '2-4h', count: 32 },
      { time: '4-8h', count: 18 },
      { time: '8-24h', count: 8 },
      { time: '24h+', count: 2 },
    ],
    techPerformance: [
      { name: 'John D.', jobs: 45, rating: 4.8 },
      { name: 'Sarah M.', jobs: 38, rating: 4.9 },
      { name: 'Mike R.', jobs: 52, rating: 4.6 },
      { name: 'Lisa K.', jobs: 29, rating: 4.7 },
    ],
    statusDistribution: [
      { status: 'Completed', count: 156 },
      { status: 'In Progress', count: 23 },
      { status: 'Pending', count: 12 },
      { status: 'On Hold', count: 5 },
    ],
    monthlyTrends: [
      { month: 'Jan', jobs: 45, revenue: 12000 },
      { month: 'Feb', jobs: 52, revenue: 15000 },
      { month: 'Mar', jobs: 48, revenue: 18000 },
      { month: 'Apr', jobs: 61, revenue: 22000 },
      { month: 'May', jobs: 55, revenue: 25000 },
      { month: 'Jun', jobs: 63, revenue: 28000 },
    ],
  };

  return (
    <div style={{minHeight:'100vh', background: 'transparent'}}>
      <div style={{background:'rgba(0,0,0,0.3)', borderBottom:'1px solid rgba(245,158,11,0.3)', padding:'20px 32px'}}>
        <div style={{maxWidth:1400, margin:'0 auto'}}>
          <Link href="/admin/admin-tools" style={{color:'#3b82f6', textDecoration:'none', fontSize:14, fontWeight:600, marginBottom:16, display:'inline-block'}}>
            <FaArrowLeft style={{marginRight:4}} /> Back to Admin Tools
          </Link>
          <h1 style={{fontSize:28, fontWeight:700, color:'#e5e7eb', marginBottom:8}}><FaChartBar style={{marginRight:4}} /> Platform Analytics</h1>
          <p style={{fontSize:14, color:'#9aa3b2'}}>Detailed analytics and performance metrics</p>
        </div>
      </div>

      <div style={{maxWidth:1400, margin:'0 auto', padding:32}}>
        {/* Key Metrics */}
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(250px, 1fr))', gap:20, marginBottom:32}}>
          <div style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(34,197,94,0.3)', borderRadius:12, padding:24}}>
            <div style={{fontSize:13, color:'#9aa3b2', marginBottom:8}}>Total Revenue</div>
            <div style={{fontSize:32, fontWeight:700, color:'#22c55e', marginBottom:8}}>$0</div>
            <div style={{fontSize:12, color:'#22c55e'}}><FaArrowUp style={{marginRight:4}} /> 0% from last month</div>
          </div>
          <div style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(59,130,246,0.3)', borderRadius:12, padding:24}}>
            <div style={{fontSize:13, color:'#9aa3b2', marginBottom:8}}>Active Users</div>
            <div style={{fontSize:32, fontWeight:700, color:'#3b82f6', marginBottom:8}}>0</div>
            <div style={{fontSize:12, color:'#3b82f6'}}><FaArrowUp style={{marginRight:4}} /> 0% from last month</div>
          </div>
          <div style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(168,85,247,0.3)', borderRadius:12, padding:24}}>
            <div style={{fontSize:13, color:'#9aa3b2', marginBottom:8}}>Work Orders</div>
            <div style={{fontSize:32, fontWeight:700, color:'#a855f7', marginBottom:8}}>0</div>
            <div style={{fontSize:12, color:'#a855f7'}}><FaArrowUp style={{marginRight:4}} /> 0% from last month</div>
          </div>
          <div style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(245,158,11,0.3)', borderRadius:12, padding:24}}>
            <div style={{fontSize:13, color:'#9aa3b2', marginBottom:8}}>Avg Response Time</div>
            <div style={{fontSize:32, fontWeight:700, color:'#f59e0b', marginBottom:8}}>0h</div>
            <div style={{fontSize:12, color:'#22c55e'}}><FaArrowDown style={{marginRight:4}} /> 0% faster</div>
          </div>
        </div>

        <div style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap:24}}>
          {/* Revenue Chart */}
          <div style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:24}}>
            <h2 style={{fontSize:20, fontWeight:700, color:'#e5e7eb', marginBottom:20}}>Revenue Trends</h2>
            <DynamicRevenueChart data={analyticsData.revenue} />
          </div>

          {/* Top Shops */}
          <div style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:24}}>
            <h2 style={{fontSize:20, fontWeight:700, color:'#e5e7eb', marginBottom:20}}>Top Performing Shops</h2>
            <div style={{display:'flex', flexDirection:'column', gap:12}}>
              {[1,2,3,4,5].map((i) => (
                <div key={i} style={{padding:12, background:'rgba(255,255,255,0.05)', borderRadius:8}}>
                  <div style={{fontSize:14, fontWeight:600, color:'#e5e7eb', marginBottom:4}}>Shop #{i}</div>
                  <div style={{fontSize:12, color:'#9aa3b2'}}>$0 revenue</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* User Activity */}
        <div style={{marginTop:24, background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:24}}>
          <h2 style={{fontSize:20, fontWeight:700, color:'#e5e7eb', marginBottom:20}}>Completion Times</h2>
          <DynamicCompletionTimesChart data={analyticsData.completionTimes} />
        </div>

        {/* Additional Charts */}
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:24, marginTop:24}}>
          {/* Technician Performance */}
          <div style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:24}}>
            <h2 style={{fontSize:20, fontWeight:700, color:'#e5e7eb', marginBottom:20}}>Technician Performance</h2>
            <DynamicTechPerformanceChart data={analyticsData.techPerformance} />
          </div>

          {/* Status Distribution */}
          <div style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:24}}>
            <h2 style={{fontSize:20, fontWeight:700, color:'#e5e7eb', marginBottom:20}}>Work Order Status</h2>
            <DynamicStatusDistributionChart data={analyticsData.statusDistribution} />
          </div>
        </div>

        {/* Monthly Trends */}
        <div style={{marginTop:24, background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:24}}>
          <h2 style={{fontSize:20, fontWeight:700, color:'#e5e7eb', marginBottom:20}}>Monthly Trends</h2>
          <DynamicMonthlyTrendsChart data={analyticsData.monthlyTrends} />
        </div>
      </div>
    </div>
  );
}
