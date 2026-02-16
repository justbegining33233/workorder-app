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

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #3d3d3d 0%, #4a4a4a 50%, #525252 100%)',
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

  useEffect(() => {
    if (user?.id) setUserId(user.id);
    if (user?.name) setUserName(user.name);
    if (user?.shopId) setShopId(user.shopId);
  }, [user]);

  const handleSignOut = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('userId');
    localStorage.removeItem('shopId');
    window.location.href = '/auth/login';
  };

  if (!userId || !shopId) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{minHeight:'100vh', background:'linear-gradient(135deg, #1f2937 0%, #374151 50%, #4b5563 100%)'}}>
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

            <RealTimeMessaging
              userId={userId}
              shopId={shopId}
              userRole="shop"
              recipientId="" // Will be set when customer is selected
              recipientRole="customer"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
