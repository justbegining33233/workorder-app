'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRequireAuth } from '@/contexts/AuthContext';

interface Vendor {
  id: string;
  name: string;
  contactName: string;
  phone: string;
  email: string;
  website: string;
  category: string;
  accountNumber: string;
  paymentTerms: string;
  rating: number;
  notes: string;
  isActive: boolean;
  createdAt: string;
}

const CATEGORIES = ['parts', 'fluids', 'tires', 'tools', 'equipment', 'other'];
const TERMS = ['Net 30', 'Net 15', 'Net 60', 'COD', 'Prepaid', 'Credit Card'];
const BLANK = { name: '', contactName: '', phone: '', email: '', website: '', category: 'parts', accountNumber: '', paymentTerms: 'Net 30', rating: '5', notes: '', isActive: true };

const ratingStars = (r: number) => '★'.repeat(Math.round(r)) + '☆'.repeat(5 - Math.round(r));

export default function VendorManagementPage() {
  const { user, isLoading } = useRequireAuth(['shop', 'manager']);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<typeof BLANK>({ ...BLANK });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState('all');

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const load = async () => {
    try {
      const res = await fetch('/api/shop/vendors', { headers });
      const data = await res.json();
      setVendors(data.vendors ?? []);
    } catch { setError('Failed to load vendors'); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (user) load(); }, [user]);

  const openCreate = () => { setEditId(null); setForm({ ...BLANK }); setShowForm(true); setError(null); };
  const openEdit = (v: Vendor) => {
    setEditId(v.id);
    setForm({ name: v.name, contactName: v.contactName, phone: v.phone, email: v.email, website: v.website, category: v.category, accountNumber: v.accountNumber, paymentTerms: v.paymentTerms, rating: String(v.rating), notes: v.notes, isActive: v.isActive });
    setShowForm(true); setError(null);
  };

  const handleSave = async () => {
    if (!form.name) { setError('Vendor name is required'); return; }
    setSaving(true); setError(null);
    try {
      const body = { ...form, rating: parseFloat(form.rating) || 5 };
      const url = editId ? `/api/shop/vendors/${editId}` : '/api/shop/vendors';
      const res = await fetch(url, { method: editId ? 'PUT' : 'POST', headers, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      setSuccess(editId ? 'Vendor updated!' : 'Vendor added!');
      setShowForm(false); load();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Remove vendor "${name}"?`)) return;
    try {
      await fetch(`/api/shop/vendors/${id}`, { method: 'DELETE', headers });
      setSuccess('Vendor removed'); load();
    } catch { setError('Delete failed'); }
  };

  const displayed = filterCategory === 'all' ? vendors : vendors.filter(v => v.category === filterCategory);
  const bg = 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)';

  if (isLoading || loading) return <div style={{ minHeight: '100vh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e5e7eb' }}>Loading...</div>;
  if (!user) return null;

  return (
    <div style={{ minHeight: '100vh', background: bg, padding: '24px', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <Link href="/shop/admin" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: 13 }}>← Admin</Link>
            <h1 style={{ color: '#f1f5f9', fontSize: 26, fontWeight: 700, margin: '4px 0 4px' }}>🏭 Vendor Management</h1>
            <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>Manage parts suppliers, distributors, and service vendors</p>
          </div>
          <button onClick={openCreate} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: '#3b82f6', color: 'white', fontWeight: 600, cursor: 'pointer' }}>+ Add Vendor</button>
        </div>

        {success && <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#86efac', fontSize: 14 }}>{success}</div>}
        {error && !showForm && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#fca5a5', fontSize: 14 }}>{error}</div>}

        {/* Filter */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {['all', ...CATEGORIES].map(cat => (
            <button key={cat} onClick={() => setFilterCategory(cat)}
              style={{ padding: '6px 14px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.15)', background: filterCategory === cat ? '#3b82f6' : 'transparent', color: filterCategory === cat ? 'white' : '#94a3b8', cursor: 'pointer', fontSize: 13, textTransform: 'capitalize' }}>
              {cat}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Total Vendors', value: vendors.length, color: '#60a5fa' },
            { label: 'Active', value: vendors.filter(v => v.isActive).length, color: '#34d399' },
            { label: 'Categories', value: new Set(vendors.map(v => v.category)).size, color: '#a78bfa' },
          ].map(s => (
            <div key={s.label} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '14px 16px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ color: s.color, fontSize: 24, fontWeight: 700 }}>{s.value}</div>
              <div style={{ color: '#64748b', fontSize: 12 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Vendor List */}
        {displayed.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#475569' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🏭</div>
            <p style={{ fontSize: 16 }}>{vendors.length === 0 ? 'No vendors yet — add your first parts supplier' : 'No vendors in this category'}</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {displayed.map((v) => (
              <div key={v.id} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 20, border: `1px solid ${v.isActive ? 'rgba(255,255,255,0.08)' : 'rgba(239,68,68,0.2)'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <h3 style={{ color: '#f1f5f9', fontWeight: 600, margin: '0 0 4px', fontSize: 16 }}>{v.name}</h3>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, background: 'rgba(139,92,246,0.2)', color: '#c4b5fd', padding: '2px 8px', borderRadius: 12, textTransform: 'capitalize' }}>{v.category}</span>
                      {!v.isActive && <span style={{ fontSize: 11, background: 'rgba(239,68,68,0.2)', color: '#fca5a5', padding: '2px 8px', borderRadius: 12 }}>Inactive</span>}
                    </div>
                  </div>
                  <span style={{ color: '#fbbf24', fontSize: 14 }}>{ratingStars(v.rating)}</span>
                </div>
                <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.7 }}>
                  {v.contactName && <div>👤 {v.contactName}</div>}
                  {v.phone && <div>📞 {v.phone}</div>}
                  {v.email && <div>✉️ {v.email}</div>}
                  {v.accountNumber && <div>🔖 Acct: {v.accountNumber}</div>}
                  {v.paymentTerms && <div>💳 {v.paymentTerms}</div>}
                </div>
                {v.notes && <p style={{ color: '#64748b', fontSize: 12, marginTop: 10, fontStyle: 'italic' }}>{v.notes}</p>}
                <div style={{ display: 'flex', gap: 8, marginTop: 14, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12 }}>
                  <button onClick={() => openEdit(v)} style={{ flex: 1, padding: '7px', borderRadius: 7, border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontSize: 13 }}>Edit</button>
                  <button onClick={() => handleDelete(v.id, v.name)} style={{ flex: 1, padding: '7px', borderRadius: 7, border: '1px solid rgba(239,68,68,0.3)', background: 'transparent', color: '#fca5a5', cursor: 'pointer', fontSize: 13 }}>Remove</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Form Modal */}
        {showForm && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
            <div style={{ background: '#1e293b', borderRadius: 16, padding: 28, width: '100%', maxWidth: 540, maxHeight: '90vh', overflow: 'auto', border: '1px solid rgba(255,255,255,0.1)' }}>
              <h2 style={{ color: '#f1f5f9', fontSize: 20, fontWeight: 700, marginBottom: 20 }}>{editId ? 'Edit Vendor' : 'Add New Vendor'}</h2>
              {[
                { label: 'Vendor Name *', key: 'name', type: 'text', placeholder: 'e.g. NAPA Auto Parts' },
                { label: 'Contact Name', key: 'contactName', type: 'text', placeholder: 'Account rep name' },
                { label: 'Phone', key: 'phone', type: 'tel', placeholder: '(555) 000-0000' },
                { label: 'Email', key: 'email', type: 'email', placeholder: 'contact@vendor.com' },
                { label: 'Website', key: 'website', type: 'url', placeholder: 'https://vendor.com' },
                { label: 'Account Number', key: 'accountNumber', type: 'text', placeholder: 'Your account #' },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key} style={{ marginBottom: 12 }}>
                  <label style={{ color: '#94a3b8', fontSize: 13, display: 'block', marginBottom: 4 }}>{label}</label>
                  <input type={type} value={(form as any)[key]} placeholder={placeholder}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: '#f1f5f9', fontSize: 14, boxSizing: 'border-box' }} />
                </div>
              ))}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ color: '#94a3b8', fontSize: 13, display: 'block', marginBottom: 4 }}>Category</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: '#1e293b', color: '#f1f5f9', fontSize: 14 }}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ color: '#94a3b8', fontSize: 13, display: 'block', marginBottom: 4 }}>Payment Terms</label>
                  <select value={form.paymentTerms} onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: '#1e293b', color: '#f1f5f9', fontSize: 14 }}>
                    {TERMS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ color: '#94a3b8', fontSize: 13, display: 'block', marginBottom: 4 }}>Rating (1-5)</label>
                <input type="number" min="1" max="5" value={form.rating}
                  onChange={(e) => setForm({ ...form, rating: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: '#f1f5f9', fontSize: 14, boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ color: '#94a3b8', fontSize: 13, display: 'block', marginBottom: 4 }}>Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: '#f1f5f9', fontSize: 14, boxSizing: 'border-box', resize: 'vertical' }} />
              </div>
              <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" id="isActive" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                <label htmlFor="isActive" style={{ color: '#94a3b8', fontSize: 14 }}>Active vendor</label>
              </div>
              {error && <p style={{ color: '#fca5a5', fontSize: 13, marginBottom: 12 }}>{error}</p>}
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={handleSave} disabled={saving} style={{ flex: 1, padding: '11px', borderRadius: 8, border: 'none', background: '#3b82f6', color: 'white', fontWeight: 600, cursor: 'pointer' }}>
                  {saving ? 'Saving…' : editId ? 'Update Vendor' : 'Add Vendor'}
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
