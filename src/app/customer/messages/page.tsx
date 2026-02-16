'use client';
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import CustomerMessagingCard from '@/components/CustomerMessagingCard';
import { useRequireAuth } from '@/contexts/AuthContext';

function MessagesContent() {
  useRequireAuth(['customer']);
  const searchParams = useSearchParams();
  const [userId, setUserId] = useState('');
  const [userName, setUserName] = useState('');
  const initialShopId = searchParams?.get('shopId') ?? undefined;

  useEffect(() => {
    const id = localStorage.getItem('userId') || '';
    const name = localStorage.getItem('userName') || '';

    setUserId(id);
    setUserName(name);
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('userId');
    localStorage.removeItem('shopId');
    window.location.href = '/auth/login';
  };

  if (!userId) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{minHeight:'100vh', background:'linear-gradient(135deg, #3d3d3d 0%, #4a4a4a 50%, #525252 100%)'}}>
      {/* Header */}
      <div style={{background:'rgba(0,0,0,0.3)', borderBottom:'1px solid rgba(229,51,42,0.3)', padding:'16px 32px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <div style={{display:'flex', alignItems:'center', gap:24}}>
          <Link href="/customer/dashboard" style={{fontSize:24, fontWeight:900, color:'#e5332a', textDecoration:'none'}}>FixTray</Link>
          <div>
            <div style={{fontSize:20, fontWeight:700, color:'#e5e7eb'}}>Customer Portal</div>
            <div style={{fontSize:12, color:'#9aa3b2'}}>Messages</div>
          </div>
        </div>
        <div style={{display:'flex', alignItems:'center', gap:16}}>
          <span style={{fontSize:14, color:'#9aa3b2'}}>Welcome, {userName}</span>
          <button onClick={handleSignOut} style={{padding:'8px 16px', background:'#e5332a', color:'white', border:'none', borderRadius:6, cursor:'pointer', fontSize:13, fontWeight:600}}>
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{padding:'32px'}}>
        <div style={{maxWidth:'1200px', margin:'0 auto'}}>
          <div style={{background:'rgba(0,0,0,0.2)', border:'1px solid rgba(229,51,42,0.2)', borderRadius:12, padding:'24px'}}>
            <h2 style={{fontSize:24, fontWeight:700, color:'#e5e7eb', marginBottom:24}}>Messages</h2>
            <CustomerMessagingCard header="Your Shops" initialShopId={initialShopId} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Messages() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MessagesContent />
    </Suspense>
  );
}