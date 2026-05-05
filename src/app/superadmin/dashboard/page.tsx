'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { useRequireAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/useIsMobile';
import MobileShell from '@/components/MobileShell';
import {
  FaBuilding, FaUsers, FaShieldAlt, FaServer, FaRocket,
  FaChartBar, FaExclamationTriangle, FaCheckCircle, FaClock,
  FaArrowRight,
} from 'react-icons/fa';

type Stats = {
  totalShops: number;
  totalUsers: number;
  activeWorkOrders: number;
  systemHealth: string;
};

export default function SuperAdminDashboard() {
  const { user, isLoading } = useRequireAuth(['superadmin']);
  const isMobile = useIsMobile();
  const [stats, setStats] = useState<Stats>({ totalShops: 0, totalUsers: 0, activeWorkOrders: 0, systemHealth: 'healthy' });
  const [tenants, setTenants] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    if (isLoading || !user) return;

    const token = localStorage.getItem('token');
    const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

    Promise.all([
      fetch('/api/admin/tenants', { headers, credentials: 'include' }).then(r => r.ok ? r.json() : { tenants: [] }),
      fetch('/api/admin/users', { headers, credentials: 'include' }).then(r => r.ok ? r.json() : { users: [] }),
      fetch('/api/admin/activity-logs', { headers, credentials: 'include' }).then(r => r.ok ? r.json() : { logs: [] }),
    ]).then(([tenantData, userData, activityData]) => {
      const t = Array.isArray(tenantData) ? tenantData : tenantData?.tenants || [];
      const u = Array.isArray(userData) ? userData : userData?.users || [];
      const logs = Array.isArray(activityData) ? activityData : activityData?.logs || [];
      setTenants(t.slice(0, 5));
      setRecentActivity(logs.slice(0, 8));
      setStats({
        totalShops: t.length,
        totalUsers: u.length,
        activeWorkOrders: 0,
        systemHealth: 'healthy',
      });
    }).catch(() => {});

    fetch('/api/workorders', { headers, credentials: 'include' })
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        const wos = Array.isArray(data) ? data : data?.workOrders || [];
        setStats(s => ({ ...s, activeWorkOrders: wos.filter((w: any) => w.status !== 'completed' && w.status !== 'cancelled').length }));
      })
      .catch(() => {});
  }, [user, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500" />
      </div>
    );
  }

  if (!user) return null;

  if (isMobile) {
    return <MobileShell role="admin" isHome userName={user.name} />;
  }

  const statCards = [
    { label: 'Total Shops', value: stats.totalShops, icon: FaBuilding, color: 'bg-indigo-500', href: '/superadmin/tenants' },
    { label: 'Total Users', value: stats.totalUsers, icon: FaUsers, color: 'bg-blue-500', href: '/superadmin/users' },
    { label: 'Active Work Orders', value: stats.activeWorkOrders, icon: FaClock, color: 'bg-amber-500', href: '/superadmin/analytics' },
    { label: 'System Health', value: stats.systemHealth === 'healthy' ? 'Healthy' : 'Issues', icon: stats.systemHealth === 'healthy' ? FaCheckCircle : FaExclamationTriangle, color: stats.systemHealth === 'healthy' ? 'bg-green-500' : 'bg-red-500', href: '/superadmin/infrastructure' },
  ];

  const quickLinks = [
    { label: 'Tenants', icon: FaBuilding, href: '/superadmin/tenants', desc: 'Manage shops & tenants' },
    { label: 'Users', icon: FaUsers, href: '/superadmin/users', desc: 'All platform users' },
    { label: 'Security', icon: FaShieldAlt, href: '/superadmin/security', desc: 'Security & audit' },
    { label: 'Infrastructure', icon: FaServer, href: '/superadmin/infrastructure', desc: 'System health' },
    { label: 'Deployments', icon: FaRocket, href: '/superadmin/deployments', desc: 'Deploy history' },
    { label: 'Analytics', icon: FaChartBar, href: '/superadmin/analytics', desc: 'Platform analytics' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 pt-20 md:pt-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Super Admin Dashboard</h1>
          <p className="text-gray-500 mt-1">Platform overview &amp; management</p>
        </div>

        {/* Stat Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map(card => (
            <Link key={card.label} href={card.href as Route} className="bg-white rounded-2xl shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 ${card.color} rounded-xl flex items-center justify-center`}>
                  <card.icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm text-gray-500">{card.label}</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            </Link>
          ))}
        </div>

        {/* Quick Links */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {quickLinks.map(link => (
            <Link key={link.label} href={link.href as Route} className="bg-white rounded-2xl shadow-sm p-5 hover:shadow-md transition-shadow flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center">
                <link.icon className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{link.label}</p>
                <p className="text-sm text-gray-500">{link.desc}</p>
              </div>
              <FaArrowRight className="w-4 h-4 text-gray-300 ml-auto" />
            </Link>
          ))}
        </div>

        {/* Recent Tenants */}
        {tenants.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Shops</h2>
            <div className="space-y-3">
              {tenants.map((t: any) => (
                <div key={t.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                      <FaBuilding className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{t.shopName || t.name || 'Unnamed Shop'}</p>
                      <p className="text-sm text-gray-500">{t.ownerName || t.email || ''}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Activity */}
        {recentActivity.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
            <div className="space-y-2">
              {recentActivity.map((log: any, i: number) => (
                <div key={log.id || i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl text-sm">
                  <FaClock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-700 flex-1">{log.action || log.message || JSON.stringify(log)}</span>
                  <span className="text-gray-400 text-xs">{log.timestamp || log.createdAt ? new Date(log.timestamp || log.createdAt).toLocaleString() : ''}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
