'use client';
import { useState, useEffect } from 'react';
import useRequireAuth from '@/lib/useRequireAuth';

interface TaxRule {
  id: string;
  name: string;
  rate: number;
  appliesToParts: boolean;
  appliesToLabor: boolean;
  appliesToFees: boolean;
  state?: string;
  county?: string;
  isDefault: boolean;
  isActive: boolean;
}

export default function TaxSettingsPage() {
  const { user, isLoading } = useRequireAuth(['shop', 'manager']);
  const [rules, setRules] = useState<TaxRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', rate: '', appliesToParts: true, appliesToLabor: true, appliesToFees: false, state: '', county: '', isDefault: false, isActive: true });
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (!user) return; load(); }, [user]);

  const load = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    const r = await fetch('/api/tax-rules', { headers: { Authorization: `Bearer ${token}` } });
    if (r.ok) setRules(await r.json());
    setLoading(false);
  };

  const save = async () => {
    if (!form.name || !form.rate) { alert('Name and rate are required.'); return; }
    setSaving(true);
    const token = localStorage.getItem('token');
    const r = await fetch('/api/tax-rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...form, rate: Number(form.rate) }),
    });
    if (r.ok) { setShowForm(false); setForm({ name: '', rate: '', appliesToParts: true, appliesToLabor: true, appliesToFees: false, state: '', county: '', isDefault: false, isActive: true }); load(); }
    setSaving(false);
  };

  if (isLoading) return <div style={{ minHeight: '100vh', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e5e7eb' }}>Loading...</div>;
  if (!user) return null;

  return (
    <div style={{ minHeight: '100vh', background: 'transparent', color: '#e5e7eb', fontFamily: 'system-ui,sans-serif' }}>
      <div style={{ background: 'rgba(0,0,0,0.3)', padding: '24px 32px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700 }}>🧾 Tax Rules</h1>
          <p style={{ margin: '4px 0 0', color: '#9ca3af', fontSize: 14 }}>Configure tax rates for parts, labor, and fees</p>
        </div>
        <button onClick={() => setShowForm(true)} style={{ background: '#e5332a', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>+ Add Tax Rule</button>
      </div>

      <div style={{ padding: 32 }}>
        {loading ? <div style={{ color: '#6b7280' }}>Loading...</div> :
          rules.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 80 }}>
              <div style={{ fontSize: 64 }}>🧾</div>
              <div style={{ fontSize: 18, fontWeight: 600, margin: '16px 0 8px' }}>No tax rules configured</div>
              <div style={{ color: '#9ca3af', marginBottom: 24 }}>Add your local tax rates to automatically apply taxes to invoices</div>
              <button onClick={() => setShowForm(true)} style={{ background: '#e5332a', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 28px', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>+ Add First Tax Rule</button>
            </div>
          ) : (
            <div>
              {rules.map(rule => (
                <div key={rule.id} style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${rule.isDefault ? 'rgba(229,51,42,0.4)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 12, padding: '16px 20px', marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                        {rule.name}
                        {rule.isDefault && <span style={{ background: 'rgba(229,51,42,0.2)', color: '#e5332a', border: '1px solid #e5332a', borderRadius: 20, padding: '1px 10px', fontSize: 11, fontWeight: 700 }}>Default</span>}
                        {!rule.isActive && <span style={{ background: 'rgba(107,114,128,0.2)', color: '#9ca3af', borderRadius: 20, padding: '1px 10px', fontSize: 11 }}>Inactive</span>}
                      </div>
                      <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>
                        {rule.state && `${rule.state}${rule.county ? ` · ${rule.county}` : ''} · `}
                        {rule.appliesToParts && '📦 Parts '}{rule.appliesToLabor && '🔧 Labor '}{rule.appliesToFees && '💲 Fees'}
                      </div>
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: '#60a5fa' }}>{rule.rate}%</div>
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: 20 }}>
          <div style={{ background: '#1f2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: 28, width: 440, maxWidth: '100%' }}>
            <h3 style={{ margin: '0 0 20px', fontSize: 18 }}>Add Tax Rule</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 13, color: '#9ca3af', display: 'block', marginBottom: 6 }}>Rule Name *</label>
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="State Sales Tax"
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '10px 12px', color: '#e5e7eb', fontSize: 14, boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 13, color: '#9ca3af', display: 'block', marginBottom: 6 }}>Rate (%) *</label>
                <input value={form.rate} onChange={e => setForm(p => ({ ...p, rate: e.target.value }))} type="number" step="0.001" placeholder="8.875"
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '10px 12px', color: '#e5e7eb', fontSize: 14, boxSizing: 'border-box' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 13, color: '#9ca3af', display: 'block', marginBottom: 6 }}>State</label>
                <input value={form.state} onChange={e => setForm(p => ({ ...p, state: e.target.value }))} placeholder="NY"
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '10px 12px', color: '#e5e7eb', fontSize: 14, boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 13, color: '#9ca3af', display: 'block', marginBottom: 6 }}>County (optional)</label>
                <input value={form.county} onChange={e => setForm(p => ({ ...p, county: e.target.value }))} placeholder="Nassau"
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '10px 12px', color: '#e5e7eb', fontSize: 14, boxSizing: 'border-box' }} />
              </div>
            </div>

            <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <label style={{ fontSize: 13, color: '#9ca3af', display: 'block', marginBottom: 4 }}>Applies To</label>
              {[['appliesToParts', '📦 Parts'], ['appliesToLabor', '🔧 Labor'], ['appliesToFees', '💲 Environmental Fees']].map(([k, label]) => (
                <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14 }}>
                  <input type="checkbox" checked={(form as any)[k]} onChange={e => setForm(p => ({ ...p, [k]: e.target.checked }))} />
                  {label}
                </label>
              ))}
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14 }}>
                <input type="checkbox" checked={form.isDefault} onChange={e => setForm(p => ({ ...p, isDefault: e.target.checked }))} />
                Set as default tax rule
              </label>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={save} disabled={saving} style={{ flex: 1, background: '#e5332a', color: '#fff', border: 'none', borderRadius: 8, padding: '11px 0', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>{saving ? 'Saving...' : 'Save Rule'}</button>
              <button onClick={() => setShowForm(false)} style={{ flex: 1, background: 'transparent', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '11px 0', fontSize: 14, cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
