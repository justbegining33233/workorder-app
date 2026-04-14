'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { useRequireAuth } from '@/contexts/AuthContext';
import { FaArrowLeft, FaUser, FaSave, FaShieldAlt, FaEnvelope, FaPhone } from 'react-icons/fa';

export default function SuperAdminProfile() {
  const { user, isLoading } = useRequireAuth(['superadmin']);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      const u = user as any;
      setEmail(u.email || '');
      setPhone(u.phone || '');
    }
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch('/api/auth/profile', { method: 'PUT', headers, credentials: 'include', body: JSON.stringify({ name, phone }) });
      if (res.ok) { setToast('Profile updated'); } else { setToast('Failed to update'); }
      setTimeout(() => setToast(''), 3000);
    } catch { setToast('Error saving profile'); setTimeout(() => setToast(''), 3000); }
    finally { setSaving(false); }
  };

  if (isLoading) {
    return (<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500" /></div>);
  }
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 pt-20 md:pt-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href={"/superadmin/dashboard" as Route} className="p-2 hover:bg-gray-100 rounded-lg"><FaArrowLeft className="w-4 h-4 text-gray-500" /></Link>
          <div><h1 className="text-3xl font-bold text-gray-900">Profile</h1><p className="text-gray-500 mt-1">Your account details</p></div>
        </div>
        {toast && <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${toast.includes('updated') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>{toast}</div>}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center"><FaShieldAlt className="w-8 h-8 text-indigo-600" /></div>
            <div>
              <p className="text-xl font-bold text-gray-900">{user.name || 'Super Admin'}</p>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-600"><FaShieldAlt className="w-3 h-3" /> Super Admin</span>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><FaUser className="w-3 h-3" /> Full Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><FaEnvelope className="w-3 h-3" /> Email</label>
              <input type="email" value={email} disabled className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed" />
              <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><FaPhone className="w-3 h-3" /> Phone</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(555) 000-0000" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900" />
            </div>
          </div>
          <div className="mt-6">
            <button onClick={handleSave} disabled={saving} className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 disabled:opacity-50 transition-colors font-medium">
              <FaSave className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
