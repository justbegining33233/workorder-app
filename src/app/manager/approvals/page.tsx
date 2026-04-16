'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import type { Route } from 'next';
import { FaCheckCircle, FaTimesCircle, FaClock, FaDollarSign, FaEye } from 'react-icons/fa';

interface Approval {
  id: string;
  title: string;
  customerName: string;
  estimatedCost: number;
  status: string;
  createdAt: string;
  priority: string;
}

export default function ManagerApprovalsPage() {
  const { user } = useAuth();
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');

  const fetchApprovals = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/workorders?status=pending_approval,estimate_sent');
      if (res.ok) {
        const json = await res.json();
        const items = (json.workOrders ?? json ?? []).map(
          (wo: { id: string; title?: string; issueDescription?: string; customerName?: string; customer?: { name: string }; estimatedCost?: number; status: string; createdAt: string; priority?: string }) => ({
            id: wo.id,
            title: wo.title || wo.issueDescription || 'Work Order',
            customerName: wo.customerName || wo.customer?.name || 'Unknown',
            estimatedCost: wo.estimatedCost || 0,
            status: wo.status,
            createdAt: wo.createdAt,
            priority: wo.priority || 'medium',
          })
        );
        setApprovals(items);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchApprovals(); }, [fetchApprovals]);

  const priorityColor: Record<string, string> = {
    urgent: 'text-red-700 bg-red-50',
    high: 'text-orange-700 bg-orange-50',
    medium: 'text-yellow-700 bg-yellow-50',
    low: 'text-green-700 bg-green-50',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
      </div>
    );
  }

  const filtered = filter === 'all' ? approvals : approvals.filter(a => a.status === 'pending_approval' || a.status === 'estimate_sent');

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pending Approvals</h1>
          <p className="text-gray-500">{filtered.length} items awaiting review</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === 'pending' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            Pending
          </button>
          <button onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === 'all' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            All
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <FaCheckCircle className="w-12 h-12 text-green-300 mx-auto mb-3" />
          <p className="text-gray-500 text-lg">No pending approvals</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(a => (
            <div key={a.id} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900 truncate">{a.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityColor[a.priority] || 'text-gray-600 bg-gray-50'}`}>{a.priority}</span>
                </div>
                <p className="text-sm text-gray-500">
                  {a.customerName} &bull; Est. ${a.estimatedCost.toLocaleString()} &bull; {new Date(a.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <Link href={`/workorders/${a.id}` as Route} className="flex items-center gap-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700">
                  <FaEye className="w-3 h-3" /> View
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
