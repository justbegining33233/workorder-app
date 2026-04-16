'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { FaChartBar, FaUsers, FaClock, FaDollarSign, FaDownload } from 'react-icons/fa';

interface ReportData {
  totalWorkOrders: number;
  completedWorkOrders: number;
  avgCompletionTime: string;
  totalRevenue: number;
  techPerformance: { name: string; completed: number; avgTime: string }[];
}

export default function ManagerReportsPage() {
  const { user } = useAuth();
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30');

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const endDate = new Date().toISOString();
      const startDate = new Date(Date.now() - parseInt(dateRange) * 86400000).toISOString();
      const res = await fetch(`/api/analytics?startDate=${startDate}&endDate=${endDate}`);
      if (res.ok) {
        const json = await res.json();
        setData({
          totalWorkOrders: json.totalWorkOrders ?? 0,
          completedWorkOrders: json.completedWorkOrders ?? 0,
          avgCompletionTime: json.avgCompletionTime ?? 'N/A',
          totalRevenue: json.totalRevenue ?? 0,
          techPerformance: json.techPerformance ?? [],
        });
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Performance Reports</h1>
          <p className="text-gray-500">Analytics and performance metrics for your team</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
          <a
            href={`/api/analytics/export?format=csv&startDate=${new Date(Date.now() - parseInt(dateRange) * 86400000).toISOString()}&endDate=${new Date().toISOString()}`}
            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700"
            download
          >
            <FaDownload className="w-4 h-4" /> Export CSV
          </a>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg"><FaChartBar className="w-5 h-5 text-blue-600" /></div>
            <div>
              <p className="text-sm text-gray-500">Total Work Orders</p>
              <p className="text-2xl font-bold">{data?.totalWorkOrders ?? 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg"><FaUsers className="w-5 h-5 text-green-600" /></div>
            <div>
              <p className="text-sm text-gray-500">Completed</p>
              <p className="text-2xl font-bold">{data?.completedWorkOrders ?? 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg"><FaDollarSign className="w-5 h-5 text-yellow-600" /></div>
            <div>
              <p className="text-sm text-gray-500">Revenue</p>
              <p className="text-2xl font-bold">${(data?.totalRevenue ?? 0).toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg"><FaClock className="w-5 h-5 text-orange-600" /></div>
            <div>
              <p className="text-sm text-gray-500">Avg Completion</p>
              <p className="text-2xl font-bold">{data?.avgCompletionTime ?? 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tech Performance Table */}
      {(data?.techPerformance?.length ?? 0) > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Technician Performance</h2>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-5 py-3 text-sm font-medium text-gray-500">Technician</th>
                <th className="text-left px-5 py-3 text-sm font-medium text-gray-500">Completed</th>
                <th className="text-left px-5 py-3 text-sm font-medium text-gray-500">Avg Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data!.techPerformance.map((t, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-5 py-3 text-sm text-gray-900">{t.name}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">{t.completed}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">{t.avgTime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
