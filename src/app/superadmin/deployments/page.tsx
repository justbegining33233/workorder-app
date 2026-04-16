'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { useRequireAuth } from '@/contexts/AuthContext';
import {
  FaRocket, FaArrowLeft, FaCheckCircle, FaClock, FaTimesCircle,
  FaSyncAlt, FaCodeBranch, FaCalendarAlt,
} from 'react-icons/fa';

type Deployment = {
  id: string;
  version: string;
  environment: string;
  status: 'success' | 'failed' | 'in-progress' | 'pending';
  timestamp: string;
  commit?: string;
  duration?: string;
  deployer?: string;
};

export default function SuperAdminDeployments() {
  const { user, isLoading } = useRequireAuth(['superadmin']);

  // Static deployment log — in a production system this would come from a CI/CD API
  const [deployments] = useState<Deployment[]>([
    {
      id: '1',
      version: 'v0.0.5',
      environment: 'Production',
      status: 'success',
      timestamp: new Date().toISOString(),
      duration: '2m 34s',
      deployer: 'System',
    },
    {
      id: '2',
      version: 'v0.0.4',
      environment: 'Production',
      status: 'success',
      timestamp: new Date(Date.now() - 7 * 86400000).toISOString(),
      duration: '3m 12s',
      deployer: 'System',
    },
    {
      id: '3',
      version: 'v0.0.3',
      environment: 'Production',
      status: 'success',
      timestamp: new Date(Date.now() - 14 * 86400000).toISOString(),
      duration: '2m 58s',
      deployer: 'System',
    },
  ]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500" />
      </div>
    );
  }

  if (!user) return null;

  const statusConfig: Record<string, { icon: any; color: string; bg: string }> = {
    'success': { icon: FaCheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
    'failed': { icon: FaTimesCircle, color: 'text-red-600', bg: 'bg-red-50' },
    'in-progress': { icon: FaSyncAlt, color: 'text-blue-600', bg: 'bg-blue-50' },
    'pending': { icon: FaClock, color: 'text-amber-600', bg: 'bg-amber-50' },
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 pt-20 md:pt-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href={"/superadmin/dashboard" as Route} className="p-2 hover:bg-gray-100 rounded-lg">
            <FaArrowLeft className="w-4 h-4 text-gray-500" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Deployments</h1>
            <p className="text-gray-500 mt-1">Release history &amp; deployment status</p>
          </div>
        </div>

        {/* Current Version */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-indigo-500 rounded-2xl flex items-center justify-center">
              <FaRocket className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-sm text-indigo-600 font-medium">Current Version</p>
              <p className="text-2xl font-bold text-gray-900">v0.0.5</p>
              <p className="text-sm text-gray-500">FixTray Work Order Platform</p>
            </div>
          </div>
        </div>

        {/* Deployment History */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Deployment History</h2>
          <div className="space-y-4">
            {deployments.map(dep => {
              const sc = statusConfig[dep.status] || statusConfig.pending;
              const Icon = sc.icon;
              return (
                <div key={dep.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className={`w-10 h-10 ${sc.bg} rounded-xl flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${sc.color} ${dep.status === 'in-progress' ? 'animate-spin' : ''}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900">{dep.version}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sc.bg} ${sc.color}`}>
                        {dep.status}
                      </span>
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                        {dep.environment}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                      {dep.deployer && <span>by {dep.deployer}</span>}
                      {dep.duration && (
                        <span className="flex items-center gap-1">
                          <FaClock className="w-3 h-3" /> {dep.duration}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <FaCalendarAlt className="w-3 h-3" /> {new Date(dep.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
