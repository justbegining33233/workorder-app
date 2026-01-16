'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [adminUsername, setAdminUsername] = useState('');

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    const username = localStorage.getItem('adminUsername');

    if (role !== 'admin') {
      router.push('/admin/login');
      return;
    }

    setAdminUsername(username || '');
    fetchStats();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [router]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else if (response.status === 401) {
        router.push('/admin/login');
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/admin/login');
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 100%)', padding: '40px 20px' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', color: '#fff', textAlign: 'center' }}>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 100%)', padding: '40px 20px' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
          <div>
            <h1 style={{ color: '#fff', fontSize: 32, margin: 0 }}>Admin Dashboard</h1>
            <p style={{ color: '#9aa3b2', margin: '8px 0 0 0' }}>Welcome back, {adminUsername}</p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <Link
              href="/admin/shops"
              style={{
                background: 'rgba(59, 130, 246, 0.2)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                color: '#60a5fa',
                padding: '12px 24px',
                borderRadius: 8,
                fontSize: 15,
                fontWeight: 600,
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              Manage Shops
            </Link>
            <button
              onClick={handleLogout}
              style={{
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#ef4444',
                padding: '12px 24px',
                borderRadius: 8,
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Logout
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats?.stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20, marginBottom: 40 }}>
            <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: 12, padding: 24 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🏪</div>
              <div style={{ color: '#9aa3b2', fontSize: 13, marginBottom: 4 }}>Total Shops</div>
              <div style={{ color: '#3b82f6', fontSize: 32, fontWeight: 700 }}>{stats.stats.totalShops}</div>
              {stats.stats.pendingShops > 0 && (
                <div style={{ color: '#eab308', fontSize: 12, marginTop: 8 }}>
                  {stats.stats.pendingShops} pending approval
                </div>
              )}
            </div>

            <div style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: 12, padding: 24 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>👥</div>
              <div style={{ color: '#9aa3b2', fontSize: 13, marginBottom: 4 }}>Total Customers</div>
              <div style={{ color: '#22c55e', fontSize: 32, fontWeight: 700 }}>{stats.stats.totalCustomers}</div>
            </div>

            <div style={{ background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: 12, padding: 24 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🔧</div>
              <div style={{ color: '#9aa3b2', fontSize: 13, marginBottom: 4 }}>Total Technicians</div>
              <div style={{ color: '#a855f7', fontSize: 32, fontWeight: 700 }}>{stats.stats.totalTechs}</div>
            </div>

            <div style={{ background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.3)', borderRadius: 12, padding: 24 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
              <div style={{ color: '#9aa3b2', fontSize: 13, marginBottom: 4 }}>Total Work Orders</div>
              <div style={{ color: '#eab308', fontSize: 32, fontWeight: 700 }}>{stats.stats.totalWorkOrders}</div>
            </div>

            <div style={{ background: 'rgba(229, 51, 42, 0.1)', border: '1px solid rgba(229, 51, 42, 0.3)', borderRadius: 12, padding: 24 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>💰</div>
              <div style={{ color: '#9aa3b2', fontSize: 13, marginBottom: 4 }}>Platform Revenue (30d)</div>
              <div style={{ color: '#e5332a', fontSize: 32, fontWeight: 700 }}>
                ${stats.stats.totalRevenue.toFixed(2)}
              </div>
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 24 }}>
          <h2 style={{ color: '#fff', fontSize: 20, marginBottom: 20 }}>Recent Shop Registrations</h2>
          
          {stats?.recentActivity?.shops?.length > 0 ? (
            <div style={{ display: 'grid', gap: 12 }}>
              {stats.recentActivity.shops.map((shop: any) => (
                <div
                  key={shop.id}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8,
                    padding: 16,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ color: '#e5e7eb', fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
                      {shop.shopName}
                    </div>
                    <div style={{ color: '#9aa3b2', fontSize: 13 }}>
                      Registered: {new Date(shop.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <span
                      style={{
                        padding: '6px 12px',
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 600,
                        background:
                          shop.status === 'approved'
                            ? 'rgba(34, 197, 94, 0.2)'
                            : shop.status === 'pending'
                            ? 'rgba(234, 179, 8, 0.2)'
                            : 'rgba(239, 68, 68, 0.2)',
                        color:
                          shop.status === 'approved'
                            ? '#22c55e'
                            : shop.status === 'pending'
                            ? '#eab308'
                            : '#ef4444',
                      }}
                    >
                      {shop.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 40, color: '#9aa3b2' }}>
              No recent activity
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div style={{ marginTop: 40 }}>
          <h2 style={{ color: '#fff', fontSize: 20, marginBottom: 20 }}>Quick Actions</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <Link
              href="/admin/shops"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 12,
                padding: 24,
                textDecoration: 'none',
                textAlign: 'center',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 12 }}>🏪</div>
              <div style={{ color: '#e5e7eb', fontSize: 15, fontWeight: 600 }}>Manage Shops</div>
            </Link>

            <Link
              href="/admin/users"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 12,
                padding: 24,
                textDecoration: 'none',
                textAlign: 'center',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 12 }}>👥</div>
              <div style={{ color: '#e5e7eb', fontSize: 15, fontWeight: 600 }}>Manage Users</div>
            </Link>

            <Link
              href="/admin/logs"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 12,
                padding: 24,
                textDecoration: 'none',
                textAlign: 'center',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
              <div style={{ color: '#e5e7eb', fontSize: 15, fontWeight: 600 }}>View Logs</div>
            </Link>

            <Link
              href="/admin/settings"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 12,
                padding: 24,
                textDecoration: 'none',
                textAlign: 'center',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 12 }}>⚙️</div>
              <div style={{ color: '#e5e7eb', fontSize: 15, fontWeight: 600 }}>Settings</div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
