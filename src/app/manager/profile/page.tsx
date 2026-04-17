'use client';

import { useState, useEffect } from 'react';
import { useRequireAuth } from '@/contexts/AuthContext';
import TopNavBar from '@/components/TopNavBar';
import Sidebar from '@/components/Sidebar';
import Breadcrumbs from '@/components/Breadcrumbs';
import { FaUser, FaEnvelope, FaPhone, FaCog, FaSave } from 'react-icons/fa';
import Link from 'next/link';
import type { Route } from 'next';

export default function ManagerProfilePage() {
  const { user, isLoading } = useRequireAuth(['manager']);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail((user as Record<string, unknown>).email as string || '');
      setPhone((user as Record<string, unknown>).phone as string || '');
    }
  }, [user]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, phone }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e5e7eb' }}>Loading...</div>;
  if (!user) return null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0a0a' }}>
      <Sidebar role="manager" isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <TopNavBar onMenuToggle={() => setSidebarOpen(o => !o)} showMenuButton />
        <main style={{ flex: 1, padding: 24, maxWidth: 800, margin: '0 auto', width: '100%' }}>
          <Breadcrumbs />
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#e5e7eb', margin: '16px 0 24px' }}>My Profile</h1>

          <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 24, marginBottom: 16 }}>
            {/* Avatar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6', fontSize: 24 }}>
                <FaUser />
              </div>
              <div>
                <div style={{ color: '#e5e7eb', fontWeight: 600, fontSize: 18 }}>{name || 'Manager'}</div>
                <div style={{ color: '#6b7280', fontSize: 14, textTransform: 'capitalize' }}>{user.role}</div>
              </div>
            </div>

            {/* Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', color: '#9aa3b2', fontSize: 13, marginBottom: 6 }}><FaUser style={{ marginRight: 4, fontSize: 11 }} /> Full Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} style={{ width: '100%', padding: '10px 14px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#e5e7eb', fontSize: 14, boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', color: '#9aa3b2', fontSize: 13, marginBottom: 6 }}><FaEnvelope style={{ marginRight: 4, fontSize: 11 }} /> Email</label>
                <input type="email" value={email} disabled style={{ width: '100%', padding: '10px 14px', background: 'rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8, color: '#6b7280', fontSize: 14, boxSizing: 'border-box' }} />
                <p style={{ color: '#4b5563', fontSize: 12, marginTop: 4 }}>Contact admin to change email</p>
              </div>
              <div>
                <label style={{ display: 'block', color: '#9aa3b2', fontSize: 13, marginBottom: 6 }}><FaPhone style={{ marginRight: 4, fontSize: 11 }} /> Phone</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(555) 123-4567" style={{ width: '100%', padding: '10px 14px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#e5e7eb', fontSize: 14, boxSizing: 'border-box' }} />
              </div>
            </div>

            {/* Save */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 20 }}>
              <button onClick={handleSave} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 8, background: '#3b82f6', color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer', border: 'none', opacity: saving ? 0.6 : 1 }}>
                <FaSave /> {saving ? 'Saving...' : 'Save Changes'}
              </button>
              {saved && <span style={{ color: '#22c55e', fontSize: 14 }}>Profile updated!</span>}
            </div>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 20 }}>
            <h2 style={{ color: '#e5e7eb', fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Quick Links</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              <Link href={'/manager/settings' as Route} style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#3b82f6', fontSize: 14, textDecoration: 'none' }}>
                <FaCog /> Settings
              </Link>
              <Link href={'/manager/settings/two-factor' as Route} style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#3b82f6', fontSize: 14, textDecoration: 'none' }}>
                <FaCog /> Two-Factor Auth
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
