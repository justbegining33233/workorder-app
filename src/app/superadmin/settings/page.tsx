'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { useRequireAuth } from '@/contexts/AuthContext';
import {
  FaGlobe, FaArrowLeft, FaCog,
  FaBell, FaSave, FaCheck,
} from 'react-icons/fa';

export default function SuperAdminSettings() {
  const { user, isLoading } = useRequireAuth(['superadmin']);
  const [settings, setSettings] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoading || !user) return;
    const token = localStorage.getItem('token');
    const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
    fetch('/api/admin/settings', { headers, credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => setSettings(data || {
        platformName: 'FixTray',
        maintenanceMode: false,
        allowSignups: true,
        defaultLanguage: 'en',
        emailNotifications: true,
        maxFileSize: 10,
      }))
      .catch(() => setSettings({
        platformName: 'FixTray',
        maintenanceMode: false,
        allowSignups: true,
        defaultLanguage: 'en',
        emailNotifications: true,
        maxFileSize: 10,
      }))
      .finally(() => setLoading(false));
  }, [user, isLoading]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify(settings),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // Silently handle
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500" />
      </div>
    );
  }

  if (!user || !settings) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 pt-20 md:pt-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href={"/superadmin/dashboard" as Route} className="p-2 hover:bg-gray-100 rounded-lg">
              <FaArrowLeft className="w-4 h-4 text-gray-500" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Global Settings</h1>
              <p className="text-gray-500 mt-1">Platform-wide configuration</p>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 disabled:opacity-50 transition-colors font-medium"
          >
            {saved ? <FaCheck className="w-4 h-4" /> : <FaSave className="w-4 h-4" />}
            {saved ? 'Saved!' : saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {/* General */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <FaCog className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-gray-900">General</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Platform Name</label>
              <input
                type="text"
                value={settings.platformName || ''}
                onChange={e => setSettings({ ...settings, platformName: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Default Language</label>
              <select
                value={settings.defaultLanguage || 'en'}
                onChange={e => setSettings({ ...settings, defaultLanguage: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-gray-700"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
              </select>
            </div>
          </div>
        </div>

        {/* Access */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <FaGlobe className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-gray-900">Access Controls</h2>
          </div>
          <div className="space-y-4">
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer">
              <div>
                <p className="font-medium text-gray-900">Allow New Signups</p>
                <p className="text-sm text-gray-500">Let new users register on the platform</p>
              </div>
              <input
                type="checkbox"
                checked={settings.allowSignups}
                onChange={e => setSettings({ ...settings, allowSignups: e.target.checked })}
                className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500"
              />
            </label>
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer">
              <div>
                <p className="font-medium text-gray-900">Maintenance Mode</p>
                <p className="text-sm text-gray-500">Show maintenance page to all non-admin users</p>
              </div>
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={e => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500"
              />
            </label>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <FaBell className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
          </div>
          <label className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer">
            <div>
              <p className="font-medium text-gray-900">Email Notifications</p>
              <p className="text-sm text-gray-500">Send system alerts and reports via email</p>
            </div>
            <input
              type="checkbox"
              checked={settings.emailNotifications}
              onChange={e => setSettings({ ...settings, emailNotifications: e.target.checked })}
              className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500"
            />
          </label>
        </div>
      </div>
    </div>
  );
}
