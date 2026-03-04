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
  const { user, isLoading: authLoading } = useRequireAuth(['admin', 'superadmin']);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [revokeId, setRevokeId] = useState<string|null>(null);

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
    const csrf = document.cookie.split(';').map(s=>s.trim()).find(s=>s.startsWith('csrf_token='))?.split('=')[1];
    await fetch('/api/auth/sessions', {
      method: 'DELETE',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrf || '' },
      body: JSON.stringify({ id }),
    });
    setSessions(sessions.filter(s => s.id !== id));
    setRevokeId(null);
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
                <button onClick={() => setRevokeId(s.id)} className="bg-red-600 text-white px-3 py-1 rounded">Revoke</button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      {revokeId && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}>
          <div style={{background:'#1e2533',borderRadius:14,padding:32,minWidth:300,maxWidth:400,boxShadow:'0 8px 32px rgba(0,0,0,0.5)'}}>
            <h3 style={{fontSize:18,fontWeight:700,color:'#e5e7eb',marginBottom:12}}>Revoke Session?</h3>
            <p style={{fontSize:14,color:'#9aa3b2',marginBottom:24}}>Are you sure you want to revoke this session? The user will be logged out immediately.</p>
            <div style={{display:'flex',gap:12}}>
              <button onClick={()=>revoke(revokeId)} style={{flex:1,padding:'10px 0',background:'#ef4444',color:'#fff',border:'none',borderRadius:8,fontSize:14,fontWeight:700,cursor:'pointer'}}>Revoke</button>
              <button onClick={()=>setRevokeId(null)} style={{flex:1,padding:'10px 0',background:'transparent',color:'#9aa3b2',border:'1px solid rgba(255,255,255,0.15)',borderRadius:8,fontSize:14,cursor:'pointer'}}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
