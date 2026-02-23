'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRequireAuth } from '@/contexts/AuthContext';

interface RecurringSchedule {
  id: string;
  title: string;
  issueDescription: string;
  frequency: string;
  nextRunAt: string;
  lastRunAt: string | null;
  active: boolean;
  estimatedCost: number | null;
  notes: string | null;
  customer: { firstName: string; lastName: string; email: string };
  vehicle: { make: string; model: string; year: number } | null;
}

const FREQUENCY_LABELS: Record<string, string> = {
  weekly: 'Weekly',
  biweekly: 'Every 2 Weeks',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  annually: 'Annually',
};

export default function RecurringWorkOrders() {
  useRequireAuth(['shop', 'tech', 'manager', 'admin']);

  const [schedules, setSchedules] = useState<RecurringSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [customers, setCustomers] = useState<{ id: string; firstName: string; lastName: string }[]>([]);

  const [form, setForm] = useState({
    customerId: '',
    vehicleId: '',
    title: '',
    issueDescription: '',
    frequency: 'monthly',
    serviceLocation: 'in-shop',
    vehicleType: 'car',
    estimatedCost: '',
    notes: '',
    startDate: '',
  });

  const fetchSchedules = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/recurring-workorders', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setSchedules(data.schedules);
    } catch (err) {
      console.error('Failed to fetch schedules:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/workorders?limit=all', {
        headers: { Authorization: `Bearer ${token}` },
      });
      // If the endpoint returns customers, great. Otherwise we won't pre-populate.
    } catch {}
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/recurring-workorders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...form,
          estimatedCost: form.estimatedCost ? parseFloat(form.estimatedCost) : undefined,
          vehicleId: form.vehicleId || undefined,
          startDate: form.startDate || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSchedules((prev) => [...prev, data.schedule]);
        setShowForm(false);
        setForm({
          customerId: '', vehicleId: '', title: '', issueDescription: '',
          frequency: 'monthly', serviceLocation: 'in-shop', vehicleType: 'car',
          estimatedCost: '', notes: '', startDate: '',
        });
      } else {
        alert(data.error || 'Failed to create schedule');
      }
    } catch (err) {
      alert('Error creating schedule');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (schedule: RecurringSchedule) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/recurring-workorders/${schedule.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ active: !schedule.active }),
      });
      const data = await res.json();
      if (data.success) {
        setSchedules((prev) => prev.map((s) => (s.id === schedule.id ? data.schedule : s)));
      }
    } catch {}
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this recurring schedule? This will not affect existing work orders.')) return;
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/recurring-workorders/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setSchedules((prev) => prev.filter((s) => s.id !== id));
    } catch {}
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="min-h-screen bg-[#09090B] text-slate-100">
      {/* Header */}
      <header className="bg-[#0f172a] border-b border-[#1f2937] px-5 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/shop/workorders" className="text-slate-400 hover:text-slate-100 text-sm transition-colors">
              ← Work Orders
            </Link>
            <h1 className="text-2xl font-semibold">🔄 Recurring Work Orders</h1>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
          >
            + New Schedule
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-5 py-8">
        <p className="text-slate-400 text-sm mb-6">
          Set up automated work order creation for repeat customers (oil changes, tire rotations, inspections, etc.).
          Work orders are created automatically on the schedule you define.
        </p>

        {/* Create Form */}
        {showForm && (
          <div className="bg-[#0f172a] border border-[#1f2937] rounded-2xl p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4">New Recurring Schedule</h2>
            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Customer ID *</label>
                <input
                  required
                  value={form.customerId}
                  onChange={(e) => setForm((f) => ({ ...f, customerId: e.target.value }))}
                  placeholder="Customer ID from work orders"
                  className="w-full bg-[#111827] border border-[#1f2937] rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Service Title *</label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Oil Change"
                  className="w-full bg-[#111827] border border-[#1f2937] rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-slate-400 mb-1">Description *</label>
                <textarea
                  required
                  value={form.issueDescription}
                  onChange={(e) => setForm((f) => ({ ...f, issueDescription: e.target.value }))}
                  placeholder="What service will be performed?"
                  rows={2}
                  className="w-full bg-[#111827] border border-[#1f2937] rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Frequency *</label>
                <select
                  value={form.frequency}
                  onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value }))}
                  className="w-full bg-[#111827] border border-[#1f2937] rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                >
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Every 2 Weeks</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="annually">Annually</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">First Run Date</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                  className="w-full bg-[#111827] border border-[#1f2937] rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Estimated Cost ($)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.estimatedCost}
                  onChange={(e) => setForm((f) => ({ ...f, estimatedCost: e.target.value }))}
                  placeholder="e.g. 79.99"
                  className="w-full bg-[#111827] border border-[#1f2937] rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Service Location</label>
                <select
                  value={form.serviceLocation}
                  onChange={(e) => setForm((f) => ({ ...f, serviceLocation: e.target.value }))}
                  className="w-full bg-[#111827] border border-[#1f2937] rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                >
                  <option value="in-shop">In Shop</option>
                  <option value="roadside">Roadside</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-slate-400 mb-1">Notes</label>
                <input
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Optional notes for technician"
                  className="w-full bg-[#111827] border border-[#1f2937] rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="md:col-span-2 flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-medium text-sm transition-colors"
                >
                  {saving ? 'Creating...' : 'Create Schedule'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="bg-[#1f2937] hover:bg-[#374151] text-slate-300 px-6 py-2 rounded-lg font-medium text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Schedules List */}
        {loading ? (
          <div className="text-center py-16 text-slate-400">Loading schedules...</div>
        ) : schedules.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🔄</div>
            <div className="text-slate-300 font-medium text-lg mb-2">No recurring schedules yet</div>
            <div className="text-slate-500 text-sm mb-6">
              Set up recurring work orders for repeat services like oil changes, inspections, or maintenance.
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-medium"
            >
              Create Your First Schedule
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {schedules.map((s) => (
              <div
                key={s.id}
                className={`bg-[#0f172a] border rounded-2xl p-5 ${
                  s.active ? 'border-[#1f2937]' : 'border-[#1f2937] opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-semibold text-slate-100">{s.title}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        s.active ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20 text-slate-400'
                      }`}>
                        {s.active ? 'Active' : 'Paused'}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
                        {FREQUENCY_LABELS[s.frequency] || s.frequency}
                      </span>
                    </div>
                    <div className="text-sm text-slate-400 mb-2">{s.issueDescription}</div>
                    <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                      <span>👤 {s.customer.firstName} {s.customer.lastName}</span>
                      {s.vehicle && (
                        <span>🚗 {s.vehicle.year} {s.vehicle.make} {s.vehicle.model}</span>
                      )}
                      {s.estimatedCost && <span>💰 ~${s.estimatedCost.toFixed(2)}</span>}
                      <span>📅 Next: {formatDate(s.nextRunAt)}</span>
                      {s.lastRunAt && <span>⏱ Last ran: {formatDate(s.lastRunAt)}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleToggle(s)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        s.active
                          ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                          : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                      }`}
                    >
                      {s.active ? 'Pause' : 'Resume'}
                    </button>
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Cron Info */}
        <div className="mt-10 bg-[#0f172a] border border-[#1f2937] rounded-xl p-5">
          <h3 className="font-semibold text-slate-200 mb-2">⚙️ Automation Setup</h3>
          <p className="text-slate-400 text-sm mb-3">
            Work orders are created automatically when you add a <code className="bg-[#111827] px-1.5 py-0.5 rounded text-slate-300">vercel.json</code> cron trigger:
          </p>
          <pre className="bg-[#111827] text-slate-300 text-xs rounded-lg p-4 overflow-x-auto">
{`// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/recurring-workorders",
      "schedule": "0 8 * * *"
    }
  ]
}`}
          </pre>
          <p className="text-slate-500 text-xs mt-3">
            Set <code className="bg-[#111827] px-1 rounded">CRON_SECRET</code> in your Vercel environment variables for security.
          </p>
        </div>
      </main>
    </div>
  );
}
