'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { useRequireAuth } from '@/contexts/AuthContext';
import { FaServer, FaArrowLeft, FaDatabase, FaMemory, FaMicrochip, FaCheckCircle, FaExclamationTriangle, FaSyncAlt, FaClock } from 'react-icons/fa';

type HealthData = { status?: string; uptime?: number; database?: { status: string; responseTime?: number }; memory?: { usage: number; total: number; free: number }; version?: string; };

export default function SuperAdminInfrastructure() {
  const { user, isLoading } = useRequireAuth(['superadmin']);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const fetchHealth = () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
    fetch('/api/admin/health', { headers, credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => { setHealth(data); setLastCheck(new Date()); })
      .catch(() => setHealth(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (!isLoading && user) fetchHealth(); }, [user, isLoading]);

  if (isLoading) {
    return (<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500" /></div>);
  }
  if (!user) return null;

  const formatUptime = (s?: number) => { if (!s) return '\u2014'; const d = Math.floor(s/86400); const h = Math.floor((s%86400)/3600); const m = Math.floor((s%3600)/60); return `${d}d ${h}h ${m}m`; };
  const formatBytes = (b?: number) => !b ? '\u2014' : `${(b/(1024*1024)).toFixed(0)} MB`;
  const dbOk = health?.database?.status === 'connected' || health?.database?.status === 'ok';

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 pt-20 md:pt-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href={"/superadmin/dashboard" as Route} className="p-2 hover:bg-gray-100 rounded-lg"><FaArrowLeft className="w-4 h-4 text-gray-500" /></Link>
            <div><h1 className="text-3xl font-bold text-gray-900">Infrastructure</h1><p className="text-gray-500 mt-1">System health &amp; resources</p></div>
          </div>
          <button onClick={fetchHealth} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 disabled:opacity-50 transition-colors text-sm font-medium">
            <FaSyncAlt className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
        {lastCheck && <p className="text-sm text-gray-400 mb-6 flex items-center gap-1"><FaClock className="w-3 h-3" /> Last checked: {lastCheck.toLocaleTimeString()}</p>}
        <div className={`rounded-2xl p-6 mb-6 ${health?.status === 'healthy' || health?.status === 'ok' ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
          <div className="flex items-center gap-3">
            {health?.status === 'healthy' || health?.status === 'ok' ? <FaCheckCircle className="w-8 h-8 text-green-500" /> : <FaExclamationTriangle className="w-8 h-8 text-amber-500" />}
            <div>
              <h2 className="text-xl font-bold text-gray-900">System {health?.status === 'healthy' || health?.status === 'ok' ? 'Healthy' : health ? 'Degraded' : 'Unknown'}</h2>
              <p className="text-sm text-gray-600">Uptime: {formatUptime(health?.uptime)}</p>
            </div>
          </div>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center"><FaDatabase className="w-5 h-5 text-indigo-600" /></div><h3 className="font-semibold text-gray-900">Database</h3></div>
            <div className="space-y-3">
              <div className="flex justify-between"><span className="text-sm text-gray-500">Status</span><span className={`text-sm font-medium flex items-center gap-1 ${dbOk ? 'text-green-600' : 'text-red-600'}`}>{dbOk ? <><FaCheckCircle className="w-3 h-3" /> Connected</> : <><FaExclamationTriangle className="w-3 h-3" /> Unknown</>}</span></div>
              {health?.database?.responseTime !== undefined && <div className="flex justify-between"><span className="text-sm text-gray-500">Response Time</span><span className="text-sm font-medium text-gray-900">{health.database.responseTime}ms</span></div>}
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center"><FaMemory className="w-5 h-5 text-blue-600" /></div><h3 className="font-semibold text-gray-900">Memory</h3></div>
            <div className="space-y-3">
              <div className="flex justify-between"><span className="text-sm text-gray-500">Used</span><span className="text-sm font-medium text-gray-900">{formatBytes(health?.memory?.usage)}</span></div>
              <div className="flex justify-between"><span className="text-sm text-gray-500">Total</span><span className="text-sm font-medium text-gray-900">{formatBytes(health?.memory?.total)}</span></div>
              {health?.memory?.total && health?.memory?.usage && <div className="bg-gray-100 rounded-full h-2"><div className="bg-blue-500 h-2 rounded-full" style={{ width: `${Math.min((health.memory.usage/health.memory.total)*100,100)}%` }} /></div>}
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center"><FaMicrochip className="w-5 h-5 text-purple-600" /></div><h3 className="font-semibold text-gray-900">Process</h3></div>
            <div className="space-y-3">
              <div className="flex justify-between"><span className="text-sm text-gray-500">Version</span><span className="text-sm font-medium text-gray-900">{health?.version || '\u2014'}</span></div>
              <div className="flex justify-between"><span className="text-sm text-gray-500">Uptime</span><span className="text-sm font-medium text-gray-900">{formatUptime(health?.uptime)}</span></div>
            </div>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <Link href={"/admin/backup-restore" as Route} className="bg-white rounded-2xl shadow-sm p-5 hover:shadow-md transition-shadow flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center"><FaDatabase className="w-6 h-6 text-indigo-600" /></div>
            <div><p className="font-semibold text-gray-900">Backup &amp; Restore</p><p className="text-sm text-gray-500">Database backups and restore operations</p></div>
          </Link>
          <Link href={"/admin/system-settings" as Route} className="bg-white rounded-2xl shadow-sm p-5 hover:shadow-md transition-shadow flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center"><FaServer className="w-6 h-6 text-indigo-600" /></div>
            <div><p className="font-semibold text-gray-900">System Settings</p><p className="text-sm text-gray-500">Platform configuration and environment</p></div>
          </Link>
        </div>
      </div>
    </div>
  );
}
