'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRequireAuth } from '@/contexts/AuthContext';

interface RecurringAppointment {
  id: string;
  customerName: string;
  vehicleInfo: string;
  serviceType: string;
  frequency: string;
  nextRunAt: string;
  lastRunAt: string | null;
  notes: string;
  status: 'active' | 'paused' | 'cancelled';
  createdAt: string;
}

const FREQUENCIES = ['weekly', 'biweekly', 'monthly', 'quarterly', 'annually'];
const SERVICE_TYPES = ['oil-change', 'inspection', 'tire-rotation', 'brake-check', 'filter-change', 'fluid-service', 'belt-check', 'ac-service', 'other'];

const BLANK = { customerName: '', vehicleInfo: '', serviceType: 'oil-change', frequency: 'monthly', startDate: '', notes: '' };

const freqLabel: Record<string, string> = { weekly: 'Weekly', biweekly: 'Bi-Weekly', monthly: 'Monthly', quarterly: 'Quarterly', annually: 'Annually' };
const statusColor: Record<string, string> = { active: '#34d399', paused: '#fbbf24', cancelled: '#f87171' };

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function daysUntil(iso: string) {
  const diff = Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
  if (diff < 0) return { label: `${Math.abs(diff)}d overdue`, color: '#f87171' };
  if (diff === 0) return { label: 'Today', color: '#fbbf24' };
  if (diff <= 7) return { label: `${diff}d`, color: '#fbbf24' };
  return { label: `${diff}d`, color: '#94a3b8' };
}

export default function RecurringAppointmentsPage() {
  const { user, isLoading } = useRequireAuth(['shop', 'manager']);
  const [appointments, setAppointments] = useState<RecurringAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...BLANK });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'paused'>('all');

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const load = async () => {
    try {
      const res = await fetch('/api/appointments/recurring', { headers });
      const data = await res.json();
      setAppointments(data.appointments ?? []);
    } catch { setError('Failed to load recurring appointments'); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (user) load(); }, [user]);

  const handleCreate = async () => {
    if (!form.customerName || !form.serviceType || !form.frequency) { setError('Customer name, service type, and frequency are required'); return; }
    setSaving(true); setError(null);
    try {
      const res = await fetch('/api/appointments/recurring', {
        method: 'POST', headers,
        body: JSON.stringify({ customerName: form.customerName, vehicleInfo: form.vehicleInfo, serviceType: form.serviceType, frequency: form.frequency, startDate: form.startDate || new Date().toISOString(), notes: form.notes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Create failed');
      setSuccess('Recurring appointment created!');
      setShowForm(false); setForm({ ...BLANK }); load();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await fetch(`/api/appointments/recurring/${id}`, { method: 'PUT', headers, body: JSON.stringify({ status }) });
      load();
    } catch { setError('Update failed'); }
  };

  const handleMarkRan = async (id: string) => {
    try {
      await fetch(`/api/appointments/recurring/${id}`, { method: 'PUT', headers, body: JSON.stringify({ markRan: true }) });
      setSuccess('Marked as completed — next occurrence scheduled');
      load();
    } catch { setError('Update failed'); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete recurring appointment for ${name}?`)) return;
    try {
      await fetch(`/api/appointments/recurring/${id}`, { method: 'DELETE', headers });
      setSuccess('Deleted'); load();
    } catch { setError('Delete failed'); }
  };

  const displayed = filter === 'all' ? appointments : appointments.filter(a => a.status === filter);
  const bg = 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)';

  if (isLoading || loading) return <div style={{ minHeight: '100vh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e5e7eb' }}>Loading...</div>;
  if (!user) return null;

  return (
    <div style={{ minHeight: '100vh', background: bg, padding: '24px', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <Link href="/shop/admin" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: 13 }}>← Admin</Link>
            <h1 style={{ color: '#f1f5f9', fontSize: 26, fontWeight: 700, margin: '4px 0 4px' }}>🔄 Recurring Appointments</h1>
            <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>Schedule repeat bookings for regular customers</p>
          </div>
          <button onClick={() => { setShowForm(true); setError(null); }} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: '#3b82f6', color: 'white', fontWeight: 600, cursor: 'pointer' }}>
            + Schedule Recurring
          </button>
        </div>

        {success && <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#86efac', fontSize: 14 }}>{success}</div>}
        {error && !showForm && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#fca5a5', fontSize: 14 }}>{error}</div>}

        {/* Filter */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {(['all', 'active', 'paused'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: '6px 16px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.15)', background: filter === f ? '#3b82f6' : 'transparent', color: filter === f ? 'white' : '#94a3b8', cursor: 'pointer', fontSize: 13, textTransform: 'capitalize' }}>
              {f} {f !== 'all' && `(${appointments.filter(a => a.status === f).length})`}
            </button>
          ))}
        </div>

        {displayed.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#475569' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔄</div>
            <p style={{ fontSize: 16 }}>{appointments.length === 0 ? 'No recurring appointments yet' : 'No appointments match the filter'}</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {displayed.map((a) => {
              const due = daysUntil(a.nextRunAt);
              return (
                <div key={a.id} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 20, border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <h3 style={{ color: '#f1f5f9', fontWeight: 600, margin: '0 0 4px', fontSize: 15 }}>{a.customerName}</h3>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, background: 'rgba(59,130,246,0.2)', color: '#93c5fd', padding: '2px 8px', borderRadius: 12 }}>{a.serviceType.replace(/-/g, ' ')}</span>
                        <span style={{ fontSize: 11, background: 'rgba(139,92,246,0.2)', color: '#c4b5fd', padding: '2px 8px', borderRadius: 12 }}>{freqLabel[a.frequency]}</span>
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 12, background: `${statusColor[a.status]}20`, color: statusColor[a.status] }}>{a.status}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: due.color, fontSize: 14, fontWeight: 700 }}>{due.label}</div>
                      <div style={{ color: '#64748b', fontSize: 11 }}>next run</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6 }}>
                    {a.vehicleInfo && <div>🚗 {a.vehicleInfo}</div>}
                    <div>📅 Next: {formatDate(a.nextRunAt)}</div>
                    {a.lastRunAt && <div>✅ Last: {formatDate(a.lastRunAt)}</div>}
                  </div>
                  {a.notes && <p style={{ color: '#64748b', fontSize: 12, marginTop: 8, fontStyle: 'italic' }}>{a.notes}</p>}
                  <div style={{ display: 'flex', gap: 6, marginTop: 14, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12, flexWrap: 'wrap' }}>
                    {a.status === 'active' && (
                      <button onClick={() => handleMarkRan(a.id)} style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid rgba(34,197,94,0.4)', background: 'transparent', color: '#34d399', cursor: 'pointer', fontSize: 12 }}>✓ Mark Ran</button>
                    )}
                    {a.status === 'active' && (
                      <button onClick={() => handleStatusChange(a.id, 'paused')} style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid rgba(251,191,36,0.4)', background: 'transparent', color: '#fbbf24', cursor: 'pointer', fontSize: 12 }}>Pause</button>
                    )}
                    {a.status === 'paused' && (
                      <button onClick={() => handleStatusChange(a.id, 'active')} style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid rgba(59,130,246,0.4)', background: 'transparent', color: '#60a5fa', cursor: 'pointer', fontSize: 12 }}>Resume</button>
                    )}
                    <button onClick={() => handleDelete(a.id, a.customerName)} style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid rgba(239,68,68,0.3)', background: 'transparent', color: '#fca5a5', cursor: 'pointer', fontSize: 12 }}>Delete</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Create Modal */}
        {showForm && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
            <div style={{ background: '#1e293b', borderRadius: 16, padding: 28, width: '100%', maxWidth: 500, maxHeight: '90vh', overflow: 'auto', border: '1px solid rgba(255,255,255,0.1)' }}>
              <h2 style={{ color: '#f1f5f9', fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Schedule Recurring Appointment</h2>
              {[
                { label: 'Customer Name *', key: 'customerName', placeholder: 'John Smith' },
                { label: 'Vehicle Info', key: 'vehicleInfo', placeholder: '2019 Ford F-150' },
                { label: 'Notes', key: 'notes', placeholder: 'Special instructions...' },
              ].map(({ label, key, placeholder }) => (
                <div key={key} style={{ marginBottom: 12 }}>
                  <label style={{ color: '#94a3b8', fontSize: 13, display: 'block', marginBottom: 4 }}>{label}</label>
                  <input value={(form as any)[key]} placeholder={placeholder}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: '#f1f5f9', fontSize: 14, boxSizing: 'border-box' }} />
                </div>
              ))}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ color: '#94a3b8', fontSize: 13, display: 'block', marginBottom: 4 }}>Service Type *</label>
                  <select value={form.serviceType} onChange={(e) => setForm({ ...form, serviceType: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: '#1e293b', color: '#f1f5f9', fontSize: 14 }}>
                    {SERVICE_TYPES.map(s => <option key={s} value={s}>{s.replace(/-/g, ' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ color: '#94a3b8', fontSize: 13, display: 'block', marginBottom: 4 }}>Frequency *</label>
                  <select value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: '#1e293b', color: '#f1f5f9', fontSize: 14 }}>
                    {FREQUENCIES.map(f => <option key={f} value={f}>{freqLabel[f]}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ color: '#94a3b8', fontSize: 13, display: 'block', marginBottom: 4 }}>First Appointment Date</label>
                <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value ? new Date(e.target.value).toISOString() : '' })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: '#f1f5f9', fontSize: 14, boxSizing: 'border-box' }} />
              </div>
              {error && <p style={{ color: '#fca5a5', fontSize: 13, marginBottom: 12 }}>{error}</p>}
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={handleCreate} disabled={saving} style={{ flex: 1, padding: '11px', borderRadius: 8, border: 'none', background: '#3b82f6', color: 'white', fontWeight: 600, cursor: 'pointer' }}>
                  {saving ? 'Saving…' : 'Create Recurring Appointment'}
                </button>
                <button onClick={() => { setShowForm(false); setError(null); }} style={{ padding: '11px 18px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: '#94a3b8', cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
