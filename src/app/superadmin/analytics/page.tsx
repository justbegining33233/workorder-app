'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { useRequireAuth } from '@/contexts/AuthContext';
import {
  FaChartBar, FaArrowLeft, FaUsers, FaBuilding, FaClipboardList,
  FaDollarSign, FaArrowUp,
} from 'react-icons/fa';

type Analytics = {
  totalUsers: number;
  totalShops: number;
  totalWorkOrders: number;
  completedWorkOrders: number;
  totalRevenue: number;
  avgCompletionRate: number;
};

export default function SuperAdminAnalytics() {
  const { user, isLoading } = useRequireAuth(['superadmin']);
  const [analytics, setAnalytics] = useState<Analytics>({
    totalUsers: 0,
    totalShops: 0,
    totalWorkOrders: 0,
    completedWorkOrders: 0,
    totalRevenue: 0,
    avgCompletionRate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoading || !user) return;
    const token = localStorage.getItem('token');
    const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

    Promise.all([
      fetch('/api/admin/users', { headers, credentials: 'include' }).then(r => r.ok ? r.json() : { users: [] }),
      fetch('/api/admin/tenants', { headers, credentials: 'include' }).then(r => r.ok ? r.json() : { tenants: [] }),
      fetch('/api/workorders', { headers, credentials: 'include' }).then(r => r.ok ? r.json() : []),
      fetch('/api/admin/analytics', { headers, credentials: 'include' }).then(r => r.ok ? r.json() : null),
    ]).then(([userData, tenantData, woData, analyticsData]) => {
      const users = Array.isArray(userData) ? userData : userData?.users || [];
      const tenants = Array.isArray(tenantData) ? tenantData : tenantData?.tenants || [];
      const wos = Array.isArray(woData) ? woData : woData?.workOrders || [];
      const completed = wos.filter((w: any) => w.status === 'completed');

      setAnalytics({
        totalUsers: users.length,
        totalShops: tenants.length,
        totalWorkOrders: wos.length,
        completedWorkOrders: completed.length,
        totalRevenue: analyticsData?.totalRevenue || tenants.reduce((s: number, t: any) => s + (t.totalRevenue || 0), 0),
        avgCompletionRate: wos.length > 0 ? Math.round((completed.length / wos.length) * 100) : 0,
      });
    }).catch(() => {})
      .finally(() => setLoading(false));
  }, [user, isLoading]);

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500" />
      </div>
    );
  }

  if (!user) return null;

  const cards = [
    { label: 'Total Users', value: analytics.totalUsers, icon: FaUsers, color: 'bg-blue-500', trend: null },
    { label: 'Total Shops', value: analytics.totalShops, icon: FaBuilding, color: 'bg-indigo-500', trend: null },
    { label: 'Work Orders', value: analytics.totalWorkOrders, icon: FaClipboardList, color: 'bg-green-500', trend: null },
    { label: 'Revenue', value: `$${analytics.totalRevenue.toLocaleString()}`, icon: FaDollarSign, color: 'bg-amber-500', trend: null },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 pt-20 md:pt-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href={"/superadmin/dashboard" as Route} className="p-2 hover:bg-gray-100 rounded-lg">
            <FaArrowLeft className="w-4 h-4 text-gray-500" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Platform Analytics</h1>
            <p className="text-gray-500 mt-1">Platform-wide metrics &amp; insights</p>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {cards.map(card => (
            <div key={card.label} className="bg-white rounded-2xl shadow-sm p-5">
              <div className={`w-10 h-10 ${card.color} rounded-xl flex items-center justify-center mb-3`}>
                <card.icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              <p className="text-sm text-gray-500">{card.label}</p>
            </div>
          ))}
        </div>

        {/* Completion Rate */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Completion Rate</h3>
            <div className="flex items-center gap-4">
              <div className="relative w-24 h-24">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="10" />
                  <circle
                    cx="50" cy="50" r="40" fill="none"
                    stroke="#6366f1" strokeWidth="10" strokeLinecap="round"
                    strokeDasharray={`${analytics.avgCompletionRate * 2.51} 251`}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-gray-900">
                  {analytics.avgCompletionRate}%
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500">
                  {analytics.completedWorkOrders} of {analytics.totalWorkOrders} work orders completed
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Work Order Breakdown</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Completed</span>
                <span className="text-sm font-semibold text-green-600 flex items-center gap-1">
                  <FaArrowUp className="w-3 h-3" /> {analytics.completedWorkOrders}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Active</span>
                <span className="text-sm font-semibold text-blue-600">
                  {analytics.totalWorkOrders - analytics.completedWorkOrders}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total</span>
                <span className="text-sm font-semibold text-gray-900">{analytics.totalWorkOrders}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Deep Links */}
        <div className="grid md:grid-cols-2 gap-4">
          <Link href={"/admin/platform-analytics" as Route} className="bg-white rounded-2xl shadow-sm p-5 hover:shadow-md transition-shadow flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
              <FaChartBar className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Detailed Analytics</p>
              <p className="text-sm text-gray-500">Charts, graphs, and detailed reports</p>
            </div>
          </Link>
          <Link href={"/admin/financial-reports" as Route} className="bg-white rounded-2xl shadow-sm p-5 hover:shadow-md transition-shadow flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <FaDollarSign className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Financial Reports</p>
              <p className="text-sm text-gray-500">Revenue breakdown and financials</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
