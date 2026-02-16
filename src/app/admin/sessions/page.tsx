"use client";
import React, { useEffect, useState } from 'react';
import { useRequireAuth } from '@/contexts/AuthContext';

type Session = {
  id: string;
  adminId?: string | null;
  metadata?: any;
  createdAt: string;
  expiresAt: string | null;
};

export default function AdminSessionsPage() {
  const { user, isLoading: authLoading } = useRequireAuth(['admin']);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch('/api/auth/sessions', { credentials: 'include' });
      const j = await r.json();
      setSessions(j.sessions || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { 
    if (user && !authLoading) load(); 
  }, [user, authLoading]);

  // Show loading state while checking authentication
  if (authLoading) {
    return <div className="p-4">Loading...</div>;
  }

  // If no user, the useRequireAuth hook will handle redirect
  if (!user) {
    return null;
  }

  async function revoke(id: string) {
    if (!confirm('Revoke this session?')) return;
    const csrf = document.cookie.split(';').map(s=>s.trim()).find(s=>s.startsWith('csrf_token='))?.split('=')[1];
    await fetch('/api/auth/sessions', {
      method: 'DELETE',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrf || '' },
      body: JSON.stringify({ id }),
    });
    setSessions(sessions.filter(s => s.id !== id));
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-4">Active Sessions</h1>
      {loading && <div>Loading...</div>}
      {!loading && sessions.length === 0 && <div>No active sessions found.</div>}
      <ul>
        {sessions.map(s => (
          <li key={s.id} className="mb-3 p-3 border rounded">
            <div className="flex justify-between">
              <div>
                <div><strong>Session:</strong> {s.id}</div>
                <div><strong>Admin:</strong> {s.adminId || '—'}</div>
                <div><strong>Created:</strong> {new Date(s.createdAt).toLocaleString()}</div>
                <div><strong>Expires:</strong> {s.expiresAt ? new Date(s.expiresAt).toLocaleString() : 'Never'}</div>
                {s.metadata && <div><strong>Meta:</strong> {JSON.stringify(s.metadata)}</div>}
              </div>
              <div>
                <button onClick={() => revoke(s.id)} className="bg-red-600 text-white px-3 py-1 rounded">Revoke</button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
