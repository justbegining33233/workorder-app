"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useRequireAuth } from '@/contexts/AuthContext';

export default function ShopReportsPage() {
  const router = useRouter();
  const { user, isLoading } = useRequireAuth(['shop', 'manager', 'tech']);
  const [userRole, setUserRole] = useState('');
  const [dateRange, setDateRange] = useState('30days');

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #3d3d3d 0%, #4a4a4a 50%, #525252 100%)',
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

  if (!user) {
    return null;
  }

  useEffect(() => {
    if (user?.role) setUserRole(user.role);
  }, [user]);

  const getDashboardLink = () => {
    const isShopAdmin = (user as any)?.isShopAdmin;
    if (userRole === 'shop') {
      return isShopAdmin ? '/shop/admin' : '/shop/home';
    }
    if (userRole === 'manager') return '/manager/dashboard';
    if (userRole === 'tech') return '/tech/home';
    return '/dashboard';
  };

  const stats = {
    totalRevenue: 125400,
    totalJobs: 86,
    avgJobValue: 1458,
    completionRate: 92,
    customerSatisfaction: 4.7,
    responseTime: '11 min',
  };

  const revenueByMonth: { month: string; revenue: number; jobs: number }[] = [
    { month: 'Jan', revenue: 18200, jobs: 24 },
    { month: 'Feb', revenue: 19400, jobs: 27 },
    { month: 'Mar', revenue: 21100, jobs: 29 },
    { month: 'Apr', revenue: 22600, jobs: 32 },
  ];

  const topServices = [
    { service: 'Brake + Rotor', jobs: 18, revenue: 14800 },
    { service: 'Diagnostics', jobs: 14, revenue: 9200 },
    { service: 'Oil + Filters', jobs: 22, revenue: 6100 },
  ];

  const techPerformance = [
    { name: 'Alex R.', jobs: 22, revenue: 16800, rating: 4.9, efficiency: 93 },
    { name: 'Jamie L.', jobs: 18, revenue: 14200, rating: 4.7, efficiency: 88 },
    { name: 'Chris M.', jobs: 16, revenue: 11800, rating: 4.6, efficiency: 84 },
    { name: 'Taylor S.', jobs: 12, revenue: 9400, rating: 4.5, efficiency: 79 },
  ];

  const customerMetrics = [
    { metric: 'First reply SLA', value: '92%', change: '↑ 4% vs last month' },
    { metric: 'Median response time', value: '11 min', change: '↓ 2 min' },
    { metric: 'CSAT', value: '4.7 / 5', change: '↑ 0.2' },
    { metric: 'Unanswered > 1h', value: '4', change: '↓ 3' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #3d3d3d 0%, #4a4a4a 50%, #525252 100%)' }}>
      <div style={{ background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid rgba(245,158,11,0.3)', padding: '20px 32px' }}>
        <div style={{ maxWidth: 1600, margin: '0 auto' }}>
          <Link href={getDashboardLink()} style={{ color: '#3b82f6', textDecoration: 'none', fontSize: 14, fontWeight: 600, marginBottom: 16, display: 'inline-block' }}>
            ← Back to Dashboard
          </Link>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 700, color: '#e5e7eb', marginBottom: 8 }}>📊 Tech Reports & Analytics</h1>
              <p style={{ fontSize: 14, color: '#9aa3b2' }}>Performance insights for technicians, work orders, and customer replies</p>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} style={{ padding: '10px 16px', background: 'rgba(0,0,0,0.3)', color: '#e5e7eb', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="90days">Last 90 Days</option>
                <option value="year">This Year</option>
              </select>
              <button style={{ padding: '10px 20px', background: '#22c55e', color: 'white', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                📥 Export Report
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1600, margin: '0 auto', padding: 32 }}>
        {/* Key Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20, marginBottom: 32 }}>
          <SummaryCard label="Total Revenue" value={`$${stats.totalRevenue.toLocaleString()}`} color="#22c55e" border="rgba(34,197,94,0.3)" trend="↑ 12% from last period" />
          <SummaryCard label="Total Jobs" value={stats.totalJobs} color="#3b82f6" border="rgba(59,130,246,0.3)" trend="↑ 8% from last period" />
          <SummaryCard label="Avg Job Value" value={`$${stats.avgJobValue}`} color="#f59e0b" border="rgba(245,158,11,0.3)" trend="↑ 5% from last period" />
          <SummaryCard label="Completion Rate" value={`${stats.completionRate}%`} color="#8b5cf6" border="rgba(139,92,246,0.3)" trend="↑ 2% from last period" />
          <SummaryCard label="Customer Rating" value={`⭐ ${stats.customerSatisfaction}`} color="#e5332a" border="rgba(229,51,42,0.3)" trend="↑ 0.3 from last period" />
          <SummaryCard label="Avg Response Time" value={stats.responseTime} color="#e5e7eb" border="rgba(255,255,255,0.1)" trend="↓ 3 min from last period" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginBottom: 24 }}>
          {/* Revenue Chart */}
          <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 24 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#e5e7eb', marginBottom: 20 }}>Revenue Trend</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {revenueByMonth.map((month, idx) => {
                const maxRevenue = Math.max(...revenueByMonth.map(m => m.revenue));
                const percentage = (month.revenue / maxRevenue) * 100;
                return (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 50, fontSize: 13, color: '#9aa3b2', fontWeight: 600 }}>{month.month}</div>
                    <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: 8, height: 40, position: 'relative', overflow: 'hidden' }}>
                      <div style={{ background: 'linear-gradient(90deg, #22c55e, #16a34a)', height: '100%', width: `${percentage}%`, borderRadius: 8, transition: 'width 0.3s' }} />
                      <div style={{ position: 'absolute', top: '50%', left: 16, transform: 'translateY(-50%)', fontSize: 14, fontWeight: 700, color: 'white' }}>
                        ${month.revenue.toLocaleString()}
                      </div>
                    </div>
                    <div style={{ width: 80, fontSize: 12, color: '#9aa3b2', textAlign: 'right' }}>{month.jobs} jobs</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Services */}
          <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 24 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#e5e7eb', marginBottom: 20 }}>Top Services</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {topServices.map((service, idx) => (
                <div key={idx} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#e5e7eb' }}>{service.service}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#22c55e' }}>${service.revenue}</div>
                  </div>
                  <div style={{ fontSize: 12, color: '#9aa3b2' }}>{service.jobs} jobs completed</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tech Performance */}
        <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 24, marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#e5e7eb', marginBottom: 20 }}>Technician Performance</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
              <thead>
                <tr style={{ textAlign: 'left' }}>
                  <th style={{ padding: '12px 16px', color: '#9aa3b2', fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>Technician</th>
                  <th style={{ padding: '12px 16px', color: '#9aa3b2', fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>Jobs</th>
                  <th style={{ padding: '12px 16px', color: '#9aa3b2', fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>Revenue</th>
                  <th style={{ padding: '12px 16px', color: '#9aa3b2', fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>Rating</th>
                  <th style={{ padding: '12px 16px', color: '#9aa3b2', fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>Efficiency</th>
                </tr>
              </thead>
              <tbody>
                {techPerformance.map((tech, idx) => (
                  <tr key={idx} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10 }}>
                    <td style={{ padding: '12px 16px', color: '#e5e7eb', fontWeight: 700 }}>{tech.name}</td>
                    <td style={{ padding: '12px 16px', color: '#9aa3b2' }}>{tech.jobs}</td>
                    <td style={{ padding: '12px 16px', color: '#22c55e', fontWeight: 700 }}>${tech.revenue}</td>
                    <td style={{ padding: '12px 16px', color: '#fbbf24', fontWeight: 700 }}>⭐ {tech.rating.toFixed(1)}</td>
                    <td style={{ padding: '12px 16px', color: '#60a5fa', fontWeight: 700 }}>{tech.efficiency}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Customer Metrics */}
        <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 24, marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#e5e7eb', marginBottom: 16 }}>Customer Messaging & SLAs</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
            {customerMetrics.map((item, idx) => (
              <div key={idx} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: 12, color: '#9aa3b2', marginBottom: 6 }}>{item.metric}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#e5e7eb', marginBottom: 4 }}>{item.value}</div>
                <div style={{ fontSize: 12, color: '#22c55e' }}>{item.change}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, color, border, trend }: { label: string; value: string | number; color: string; border: string; trend: string }) {
  return (
    <div style={{ background: 'rgba(0,0,0,0.3)', border: `1px solid ${border}`, borderRadius: 12, padding: 24 }}>
      <div style={{ fontSize: 13, color: '#9aa3b2', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 700, color, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 12, color }}>{trend}</div>
    </div>
  );
}
