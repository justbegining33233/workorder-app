'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { useRequireAuth } from '@/contexts/AuthContext';
import { FaChartLine, FaArrowLeft, FaUsers, FaStore, FaClipboardList, FaDollarSign, FaCheckCircle, FaClock, FaWrench } from 'react-icons/fa';

export default function SuperAdminAnalytics() {
  const { user, isLoading } = useRequireAuth(['superadmin']);
  const [stats, setStats] = useState({ users: 0, shops: 0, workOrders: 0, revenue: 0 });
  const [woBreakdown, setWoBreakdown] = useState({ completed: 0, inProgress: 0, pending: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoading || !user) return;
    const token = localStorage.getItem('token');
    const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
    const opts = { headers, credentials: 'include' as RequestCredentials };

    Promise.all([
      fetch('/api/admin/users', opts).then(r => r.ok ? r.json() : null),
      fetch('/api/admin/tenants', opts).then(r => r.ok ? r.json() : null),
      fetch('/api/workorders', opts).then(r => r.ok ? r.json() : null),
      fetch('/api/admin/analytics', opts).then(r => r.ok ? r.json() : null),
    ]).then(([usersData, tenantsData, wosData, analyticsData]) => {
      const usersList = Array.isArray(usersData) ? usersData : usersData?.users || [];
      const tenantList = Array.isArray(tenantsData) ? tenantsData : tenantsData?.tenants || [];
      const woList = Array.isArray(wosData) ? wosData : wosData?.workOrders || [];
      const completed = woList.filter((w: any) => w.status === 'completed' || w.status === 'COMPLETED').length;
      const inProgress = woList.filter((w: any) => w.status === 'in_progress' || w.status === 'IN_PROGRESS').length;
      const pending = woList.filter((w: any) => w.status === 'pending' || w.status === 'PENDING').length;
      setStats({ users: usersList.length, shops: tenantList.length, workOrders: woList.length, revenue: analyticsData?.totalRevenue || 0 });
      setWoBreakdown({ completed, inProgress, pending, total: woList.length });
    }).catch(() => {}).finally(() => setLoading(false));
  }, [user, isLoading]);

  if (isLoading || loading) {
    return (<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500" /></div>);
  }
  if (!user) return null;

  const completionRate = woBreakdown.total > 0 ? Math.round((woBreakdown.completed / woBreakdown.total) * 100) : 0;

  const statCards = [
    { label: 'Total Users', value: stats.users, icon: FaUsers, color: 'bg-indigo-50 text-indigo-600' },
    { label: 'Active Shops', value: stats.shops, icon: FaStore, color: 'bg-green-50 text-green-600' },
    { label: 'Work Orders', value: stats.workOrders, icon: FaClipboardList, color: 'bg-blue-50 text-blue-600' },
    { label: 'Revenue', value: `$${stats.revenue.toLocaleString()}`, icon: FaDollarSign, color: 'bg-amber-50 text-amber-600' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 pt-20 md:pt-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href={"/superadmin/dashboard" as Route} className="p-2 hover:bg-gray-100 rounded-lg"><FaArrowLeft className="w-4 h-4 text-gray-500" /></Link>
          <div><h1 className="text-3xl font-bold text-gray-900">Analytics</h1><p className="text-gray-500 mt-1">Platform metrics</p></div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map(card => (
            <div key={card.label} className="bg-white rounded-2xl shadow-sm p-5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${card.color.split(' ')[0]}`}><card.icon className={`w-5 h-5 ${card.color.split(' ')[1]}`} /></div>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              <p className="text-sm text-gray-500">{card.label}</p>
            </div>
          ))}
        </div>
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Completion Rate</h2>
            <div className="flex items-center justify-center py-6">
              <div className="relative w-40 h-40">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#6366f1" strokeWidth="3" strokeDasharray={`${completionRate}, 100`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center"><span className="text-3xl font-bold text-gray-900">{completionRate}%</span></div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Work Order Breakdown</h2>
            <div className="space-y-4 mt-6">
              <div className="flex items-center justify-between"><div className="flex items-center gap-2"><FaCheckCircle className="w-4 h-4 text-green-500" /><span className="text-gray-700">Completed</span></div><span className="font-semibold text-gray-900">{woBreakdown.completed}</span></div>
              <div className="flex items-center justify-between"><div className="flex items-center gap-2"><FaWrench className="w-4 h-4 text-blue-500" /><span className="text-gray-700">In Progress</span></div><span className="font-semibold text-gray-900">{woBreakdown.inProgress}</span></div>
              <div className="flex items-center justify-between"><div className="flex items-center gap-2"><FaClock className="w-4 h-4 text-amber-500" /><span className="text-gray-700">Pending</span></div><span className="font-semibold text-gray-900">{woBreakdown.pending}</span></div>
            </div>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <Link href={"/admin/platform-analytics" as Route} className="bg-white rounded-2xl shadow-sm p-5 hover:shadow-md transition-shadow flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center"><FaChartLine className="w-6 h-6 text-indigo-600" /></div>
            <div><p className="font-semibold text-gray-900">Detailed Analytics</p><p className="text-sm text-gray-500">In-depth platform metrics &amp; trends</p></div>
          </Link>
          <Link href={"/admin/financial-reports" as Route} className="bg-white rounded-2xl shadow-sm p-5 hover:shadow-md transition-shadow flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center"><FaDollarSign className="w-6 h-6 text-amber-600" /></div>
            <div><p className="font-semibold text-gray-900">Financial Reports</p><p className="text-sm text-gray-500">Revenue reports &amp; billing details</p></div>
          </Link>
        </div>
      </div>
    </div>
  );
}
