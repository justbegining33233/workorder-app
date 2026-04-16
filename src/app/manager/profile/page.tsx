'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { FaUser, FaEnvelope, FaPhone, FaCog, FaCamera, FaSave } from 'react-icons/fa';
import Link from 'next/link';
import type { Route } from 'next';

export default function ManagerProfilePage() {
  const { user } = useAuth();
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
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
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

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-500">Manage your account information</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
            <FaUser className="w-8 h-8" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{name || 'Manager'}</p>
            <p className="text-sm text-gray-500">{user?.role || 'manager'}</p>
          </div>
        </div>

        {/* Fields */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FaUser className="inline w-3 h-3 mr-1" /> Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FaEnvelope className="inline w-3 h-3 mr-1" /> Email
            </label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full border border-gray-200 bg-gray-50 rounded-lg px-4 py-2 text-gray-500"
            />
            <p className="text-xs text-gray-400 mt-1">Contact admin to change email</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FaPhone className="inline w-3 h-3 mr-1" /> Phone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="(555) 123-4567"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            <FaSave className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
          {saved && <span className="text-green-600 text-sm">Profile updated!</span>}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Quick Links</h2>
        <div className="flex flex-wrap gap-3">
          <Link href={'/manager/settings' as Route} className="flex items-center gap-2 text-purple-600 hover:text-purple-800 text-sm">
            <FaCog className="w-4 h-4" /> Settings
          </Link>
          <Link href={'/manager/settings/two-factor' as Route} className="flex items-center gap-2 text-purple-600 hover:text-purple-800 text-sm">
            <FaCog className="w-4 h-4" /> Two-Factor Auth
          </Link>
        </div>
      </div>
    </div>
  );
}
