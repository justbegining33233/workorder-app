'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { useRequireAuth } from '@/contexts/AuthContext';
import { FaCog, FaArrowLeft, FaSave, FaGlobe, FaToggleOn, FaToggleOff, FaEnvelope, FaWrench, FaPalette } from 'react-icons/fa';

type Settings = { platformName: string; defaultLanguage: string; allowSignups: boolean; maintenanceMode: boolean; emailNotifications: boolean; };

export default function SuperAdminSettings() {
  const { user, isLoading } = useRequireAuth(['superadmin']);
  const [settings, setSettings] = useState<Settings>({ platformName: 'FixTray', defaultLanguage: 'en', allowSignups: true, maintenanceMode: false, emailNotifications: true });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (isLoading || !user) return;
    const token = localStorage.getItem('token');
    const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
    fetch('/api/admin/settings', { headers, credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setSettings(prev => ({ ...prev, ...data })); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, isLoading]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;
      await fetch('/api/admin/settings', { method: 'PUT', headers, credentials: 'include', body: JSON.stringify(settings) });
      setToast('Settings saved successfully');
      setTimeout(() => setToast(''), 3000);
    } catch { setToast('Failed to save settings'); setTimeout(() => setToast(''), 3000); }
    finally { setSaving(false); }
  };

  if (isLoading || loading) {
    return (<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500" /></div>);
  }
  if (!user) return null;

  const Toggle = ({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) => (
    <button onClick={onToggle} className="text-2xl">{enabled ? <FaToggleOn className="text-indigo-500" /> : <FaToggleOff className="text-gray-300" />}</button>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 pt-20 md:pt-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href={"/superadmin/dashboard" as Route} className="p-2 hover:bg-gray-100 rounded-lg"><FaArrowLeft className="w-4 h-4 text-gray-500" /></Link>
            <div><h1 className="text-3xl font-bold text-gray-900">Settings</h1><p className="text-gray-500 mt-1">Global platform configuration</p></div>
          </div>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 disabled:opacity-50 transition-colors font-medium">
            <FaSave className="w-4 h-4" /> {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
        {toast && <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${toast.includes('success') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>{toast}</div>}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-5"><FaGlobe className="w-5 h-5 text-indigo-600" /><h2 className="text-lg font-semibold text-gray-900">General</h2></div>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Platform Name</label>
                <input type="text" value={settings.platformName} onChange={e => setSettings(s => ({ ...s, platformName: e.target.value }))} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Default Language</label>
                <select value={settings.defaultLanguage} onChange={e => setSettings(s => ({ ...s, defaultLanguage: e.target.value }))} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-gray-700">
                  <option value="en">English</option><option value="es">Spanish</option><option value="fr">French</option>
                </select></div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-5"><FaCog className="w-5 h-5 text-indigo-600" /><h2 className="text-lg font-semibold text-gray-900">Platform Controls</h2></div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"><div><p className="font-medium text-gray-900">Allow Signups</p><p className="text-sm text-gray-500">Allow new users to register</p></div><Toggle enabled={settings.allowSignups} onToggle={() => setSettings(s => ({ ...s, allowSignups: !s.allowSignups }))} /></div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"><div><p className="font-medium text-gray-900">Maintenance Mode</p><p className="text-sm text-gray-500">Show maintenance page to users</p></div><Toggle enabled={settings.maintenanceMode} onToggle={() => setSettings(s => ({ ...s, maintenanceMode: !s.maintenanceMode }))} /></div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"><div><p className="font-medium text-gray-900">Email Notifications</p><p className="text-sm text-gray-500">Send system email notifications</p></div><Toggle enabled={settings.emailNotifications} onToggle={() => setSettings(s => ({ ...s, emailNotifications: !s.emailNotifications }))} /></div>
            </div>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4 mt-6">
          <Link href={"/admin/system-settings" as Route} className="bg-white rounded-2xl shadow-sm p-5 hover:shadow-md transition-shadow flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center"><FaWrench className="w-6 h-6 text-indigo-600" /></div>
            <div><p className="font-semibold text-gray-900">System Settings</p><p className="text-sm text-gray-500">Advanced system configuration</p></div>
          </Link>
          <Link href={"/admin/email-templates" as Route} className="bg-white rounded-2xl shadow-sm p-5 hover:shadow-md transition-shadow flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center"><FaEnvelope className="w-6 h-6 text-indigo-600" /></div>
            <div><p className="font-semibold text-gray-900">Email Templates</p><p className="text-sm text-gray-500">Customize notification emails</p></div>
          </Link>
        </div>
      </div>
    </div>
  );
}
