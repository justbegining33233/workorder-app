'use client';
import { useState, useEffect } from 'react';
import useRequireAuth from '@/lib/useRequireAuth';

interface FleetAccount {
  id: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  billingAddress?: string;
  netTerms: number;
  creditLimit: number;
  status: string;
  vehicles: FleetVehicle[];
  invoices: FleetInvoice[];
}
interface FleetVehicle { id: string; make: string; model: string; year: number; vin?: string; licensePlate?: string; unitNumber?: string; }
interface FleetInvoice { id: string; invoiceNumber: string; totalAmount: number; amountPaid: number; status: string; dueDate: string; }

const statusColor: Record<string, string> = { active: '#22c55e', suspended: '#e5332a', closed: '#6b7280' };

export default function FleetPage() {
  const { user, isLoading } = useRequireAuth(['shop', 'manager']);
  const [accounts, setAccounts] = useState<FleetAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<FleetAccount | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<Partial<FleetAccount>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (!user) return; fetch2(); }, [user]);

  const fetch2 = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    const r = await window.fetch('/api/fleet', { headers: { Authorization: `Bearer ${token}` } });
    if (r.ok) setAccounts(await r.json());
    setLoading(false);
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (user) fetch2(); }, [user]);

  const save = async () => {
    setSaving(true);
    const token = localStorage.getItem('token');
    const r = await window.fetch('/api/fleet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(form),
    });
    if (r.ok) { setShowAdd(false); setForm({}); fetch2(); }
    setSaving(false);
  };

  const del = async (id: string) => {
    if (!confirm('Delete this fleet account?')) return;
    const token = localStorage.getItem('token');
    await window.fetch(`/api/fleet/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    setSelected(null); fetch2();
  };

  const F = (k: keyof FleetAccount, label: string, type = 'text') => (
    <div key={k} style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 13, color: '#9ca3af', display: 'block', marginBottom: 6 }}>{label}</label>
      <input type={type} value={String((form as any)[k] || '')} onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))}
        style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '10px 14px', color: '#e5e7eb', fontSize: 14, boxSizing: 'border-box' }} />
    </div>
  );

  if (isLoading) return <div style={{ minHeight: '100vh', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e5e7eb' }}>Loading...</div>;
  if (!user) return null;

  const totalCredit = accounts.reduce((s, a) => s + a.creditLimit, 0);
  const outstanding = accounts.reduce((s, a) => s + a.invoices.filter(i => i.status !== 'paid').reduce((ss, i) => ss + (i.totalAmount - i.amountPaid), 0), 0);

  return (
    <div style={{ minHeight: '100vh', background: 'transparent', color: '#e5e7eb', fontFamily: 'system-ui,sans-serif' }}>
      <div style={{ background: 'rgba(0,0,0,0.3)', padding: '24px 32px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700 }}>🏢 Fleet Accounts</h1>
          <p style={{ margin: '4px 0 0', color: '#9ca3af', fontSize: 14 }}>B2B clients with multiple vehicles — {accounts.length} accounts · ${outstanding.toFixed(0)} outstanding</p>
        </div>
        <button onClick={() => { setShowAdd(true); setForm({ netTerms: 30, creditLimit: 0 } as Partial<FleetAccount>); }}
          style={{ background: '#e5332a', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>+ New Fleet Account</button>
      </div>

      <div style={{ padding: 32, display: 'grid', gridTemplateColumns: selected ? '1fr 400px' : '1fr', gap: 24 }}>
        {/* Accounts List */}
        <div>
          {loading ? <div style={{ textAlign: 'center', padding: 64, color: '#6b7280' }}>Loading...</div> :
            accounts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 80 }}>
                <div style={{ fontSize: 64 }}>🏢</div>
                <div style={{ fontSize: 20, fontWeight: 600, margin: '16px 0 8px' }}>No fleet accounts yet</div>
                <div style={{ color: '#9ca3af', marginBottom: 24 }}>Add B2B clients like delivery companies or vehicle fleets</div>
                <button onClick={() => { setShowAdd(true); setForm({ netTerms: 30, creditLimit: 0 } as Partial<FleetAccount>); }}
                  style={{ background: '#e5332a', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 28px', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>+ Add Fleet Account</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {accounts.map(acc => {
                  const openBalance = acc.invoices.filter(i => i.status !== 'paid').reduce((s, i) => s + (i.totalAmount - i.amountPaid), 0);
                  return (
                    <div key={acc.id} onClick={() => setSelected(acc)}
                      style={{ background: selected?.id === acc.id ? 'rgba(229,51,42,0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${selected?.id === acc.id ? 'rgba(229,51,42,0.4)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 12, padding: '16px 20px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 16 }}>{acc.companyName}</div>
                        <div style={{ fontSize: 13, color: '#9ca3af' }}>{acc.contactName} · {acc.contactEmail}</div>
                        <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{acc.vehicles.length} vehicles · Net-{acc.netTerms}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 18, fontWeight: 700, color: openBalance > 0 ? '#f59e0b' : '#22c55e' }}>${openBalance.toFixed(2)}</div>
                        <div style={{ fontSize: 11, color: '#9ca3af' }}>outstanding</div>
                        <span style={{ background: statusColor[acc.status] + '22', color: statusColor[acc.status], border: `1px solid ${statusColor[acc.status]}`, borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>{acc.status}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
        </div>

        {/* Detail Panel */}
        {selected && (
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 20, height: 'fit-content' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18 }}>{selected.companyName}</h3>
              <button onClick={() => setSelected(null)} style={{ background: 'transparent', color: '#6b7280', border: 'none', cursor: 'pointer', fontSize: 18 }}>✕</button>
            </div>
            <div style={{ fontSize: 13, lineHeight: 2, marginBottom: 16 }}>
              <div><span style={{ color: '#9ca3af' }}>Contact: </span>{selected.contactName}</div>
              <div><span style={{ color: '#9ca3af' }}>Email: </span>{selected.contactEmail}</div>
              {selected.contactPhone && <div><span style={{ color: '#9ca3af' }}>Phone: </span>{selected.contactPhone}</div>}
              <div><span style={{ color: '#9ca3af' }}>Terms: </span>Net-{selected.netTerms}</div>
              <div><span style={{ color: '#9ca3af' }}>Credit Limit: </span>${selected.creditLimit.toFixed(2)}</div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>🚗 Vehicles ({selected.vehicles.length})</div>
              {selected.vehicles.length === 0 ? <div style={{ color: '#6b7280', fontSize: 13 }}>No vehicles added</div> :
                selected.vehicles.map(v => (
                  <div key={v.id} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '8px 12px', marginBottom: 6, fontSize: 13 }}>
                    {v.year} {v.make} {v.model} {v.unitNumber && <span style={{ color: '#9ca3af' }}>#{v.unitNumber}</span>}
                    {v.licensePlate && <div style={{ color: '#9ca3af' }}>{v.licensePlate}</div>}
                  </div>
                ))}
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>📄 Recent Invoices</div>
              {selected.invoices.length === 0 ? <div style={{ color: '#6b7280', fontSize: 13 }}>No invoices</div> :
                selected.invoices.slice(0, 3).map(inv => (
                  <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '8px 12px', marginBottom: 6, fontSize: 13 }}>
                    <span>{inv.invoiceNumber}</span>
                    <span style={{ color: inv.status === 'paid' ? '#22c55e' : '#f59e0b' }}>${inv.totalAmount.toFixed(2)}</span>
                  </div>
                ))}
            </div>

            <button onClick={() => del(selected.id)}
              style={{ width: '100%', background: 'rgba(229,51,42,0.1)', color: '#e5332a', border: '1px solid rgba(229,51,42,0.3)', borderRadius: 8, padding: '10px 0', fontSize: 14, cursor: 'pointer' }}>
              Delete Account
            </button>
          </div>
        )}
      </div>

      {/* Add Account Modal */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ background: '#1f2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: 28, width: 480, maxWidth: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 20px', fontSize: 18 }}>New Fleet Account</h3>
            {F('companyName', 'Company Name')}
            {F('contactName', 'Contact Name')}
            {F('contactEmail', 'Contact Email', 'email')}
            {F('contactPhone', 'Contact Phone')}
            {F('billingAddress', 'Billing Address')}
            {F('netTerms', 'Net Terms (days)', 'number')}
            {F('creditLimit', 'Credit Limit ($)', 'number')}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={save} disabled={saving} style={{ flex: 1, background: '#e5332a', color: '#fff', border: 'none', borderRadius: 8, padding: '11px 0', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>{saving ? 'Saving...' : 'Create Account'}</button>
              <button onClick={() => setShowAdd(false)} style={{ flex: 1, background: 'transparent', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '11px 0', fontSize: 14, cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
