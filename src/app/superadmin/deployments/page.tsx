'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useRequireAuth } from '@/contexts/AuthContext';
import { FaRocket, FaArrowLeft, FaCheckCircle, FaTimesCircle, FaSpinner, FaClock, FaCodeBranch, FaBox } from 'react-icons/fa';

const DEPLOYMENTS = [
  { id: '1', version: 'v0.0.5', env: 'Production', status: 'success', date: '2025-06-15T14:30:00Z', duration: '2m 34s', commit: 'feat: superadmin portal' },
  { id: '2', version: 'v0.0.4', env: 'Production', status: 'success', date: '2025-06-10T09:15:00Z', duration: '3m 12s', commit: 'feat: mobile app enhancements' },
  { id: '3', version: 'v0.0.3', env: 'Production', status: 'success', date: '2025-06-01T11:00:00Z', duration: '2m 58s', commit: 'feat: shop management' },
  { id: '4', version: 'v0.0.2', env: 'Staging', status: 'failed', date: '2025-05-28T16:45:00Z', duration: '1m 05s', commit: 'fix: auth token refresh' },
  { id: '5', version: 'v0.0.2', env: 'Production', status: 'success', date: '2025-05-25T10:20:00Z', duration: '2m 50s', commit: 'feat: messaging system' },
];

const statusIcons: Record<string, any> = { success: FaCheckCircle, failed: FaTimesCircle, 'in-progress': FaSpinner, pending: FaClock };
const statusColors: Record<string, string> = { success: 'text-green-500', failed: 'text-red-500', 'in-progress': 'text-blue-500', pending: 'text-gray-400' };
const statusBg: Record<string, string> = { success: 'bg-green-50', failed: 'bg-red-50', 'in-progress': 'bg-blue-50', pending: 'bg-gray-50' };

export default function SuperAdminDeployments() {
  const { user, isLoading } = useRequireAuth(['superadmin']);

  if (isLoading) {
    return (<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500" /></div>);
  }
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 pt-20 md:pt-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href={"/superadmin/dashboard" as Route} className="p-2 hover:bg-gray-100 rounded-lg"><FaArrowLeft className="w-4 h-4 text-gray-500" /></Link>
          <div><h1 className="text-3xl font-bold text-gray-900">Deployments</h1><p className="text-gray-500 mt-1">Release history &amp; status</p></div>
        </div>
        <div className="bg-indigo-500 rounded-2xl p-6 text-white mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center"><FaBox className="w-7 h-7" /></div>
            <div>
              <p className="text-sm opacity-80">Current Version</p>
              <p className="text-3xl font-bold">v0.0.5</p>
              <p className="text-sm opacity-80 mt-1 flex items-center gap-1"><FaCodeBranch className="w-3 h-3" /> main branch</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100"><h2 className="text-lg font-semibold text-gray-900">Deployment History</h2></div>
          <div className="divide-y divide-gray-50">
            {DEPLOYMENTS.map(d => {
              const Icon = statusIcons[d.status] || FaClock;
              return (
                <div key={d.id} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${statusBg[d.status]}`}>
                    <Icon className={`w-5 h-5 ${statusColors[d.status]} ${d.status === 'in-progress' ? 'animate-spin' : ''}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900">{d.version}</span>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{d.env}</span>
                    </div>
                    <p className="text-sm text-gray-500 truncate">{d.commit}</p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-sm text-gray-900">{new Date(d.date).toLocaleDateString()}</p>
                    <p className="text-xs text-gray-400">{d.duration}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-2xl p-5">
          <p className="text-sm text-blue-700"><strong>CI/CD:</strong> Deployments are managed through your hosting platform (Vercel, Railway, or Render). Configure auto-deploys from the main branch.</p>
        </div>
      </div>
    </div>
  );
}
