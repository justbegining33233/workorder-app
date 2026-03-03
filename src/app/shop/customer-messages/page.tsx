'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useRequireAuth } from '@/contexts/AuthContext';
import RealTimeMessaging from '@/components/RealTimeMessaging';

export default function CustomerMessagesPage() {
  const router = useRouter();
  const { user, isLoading } = useRequireAuth(['shop']);
  const [userId, setUserId] = useState('');
  const [userName, setUserName] = useState('');
  const [shopId, setShopId] = useState('');
  const [customers, setCustomers] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');

  useEffect(() => {
    if (user?.id) setUserId(user.id);
    if (user?.name) setUserName(user.name);
    if (user?.shopId) setShopId(user.shopId);
  }, [user]);

  useEffect(() => {
    if (!user?.shopId) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    fetch(`/api/customers?shopId=${user.shopId}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.customers) setCustomers(data.customers);
      })
      .catch(() => {});
  }, [user?.shopId]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#e5e7eb',
        fontSize: '18px'
      }}>
        Loading...
      </div>
    );
  }

  // If no user, the useRequireAuth hook will handle redirect
  if (!user) {
    return null;
  }

  const handleSignOut = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('userId');
    localStorage.removeItem('shopId');
    window.location.href = '/auth/login';
  };

  if (!userId || !shopId) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e5e7eb' }}>Loading...</div>;
  }

  return (
    <div style={{minHeight:'100vh', background: 'transparent'}}>
      {/* Header */}
      <div style={{background:'rgba(0,0,0,0.3)', borderBottom:'1px solid rgba(75,85,99,0.3)', padding:'16px 32px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <div style={{display:'flex', alignItems:'center', gap:24}}>
          <Link href="/shop/home" style={{fontSize:24, fontWeight:900, color:'#3b82f6', textDecoration:'none'}}>FixTray</Link>
          <div>
            <div style={{fontSize:20, fontWeight:700, color:'#e5e7eb'}}>Shop Portal</div>
            <div style={{fontSize:12, color:'#9aa3b2'}}>Customer Messages</div>
          </div>
        </div>
        <div style={{display:'flex', alignItems:'center', gap:16}}>
          <span style={{fontSize:14, color:'#9aa3b2'}}>Welcome, {userName}</span>
          <button onClick={handleSignOut} style={{padding:'8px 16px', background:'#dc2626', color:'white', border:'none', borderRadius:6, cursor:'pointer', fontSize:13, fontWeight:600}}>
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{padding:'32px'}}>
        <div style={{maxWidth:'1200px', margin:'0 auto'}}>
          <div style={{background:'rgba(0,0,0,0.2)', border:'1px solid rgba(75,85,99,0.2)', borderRadius:12, padding:'24px'}}>
            <h2 style={{fontSize:24, fontWeight:700, color:'#e5e7eb', marginBottom:24}}>Real-Time Customer Messaging</h2>

            {/* Customer selector */}
            <div style={{marginBottom:20}}>
              <label style={{fontSize:13, color:'#9ca3af', display:'block', marginBottom:8}}>Select Customer</label>
              <select
                value={selectedCustomerId}
                onChange={e => setSelectedCustomerId(e.target.value)}
                style={{padding:'10px 14px', background:'#1f2937', border:'1px solid rgba(255,255,255,0.15)', borderRadius:8, color:'#e5e7eb', fontSize:14, minWidth:280}}
              >
                <option value="">— Choose a customer —</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                ))}
              </select>
            </div>

            {selectedCustomerId ? (
            <RealTimeMessaging
              userId={userId}
              shopId={shopId}
              userRole="shop"
              recipientId={selectedCustomerId}
              recipientRole="customer"
            />
            ) : (
              <div style={{color:'#9ca3af', padding:'40px 0', textAlign:'center'}}>Select a customer above to start messaging.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
