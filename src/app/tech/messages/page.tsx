'use client';

import Link from 'next/link';
import MessagingCard from '@/components/MessagingCard';
import { useRequireAuth } from '@/contexts/AuthContext';

export default function TechMessages() {
  const { user, isLoading } = useRequireAuth(['tech', 'manager']);

  if (isLoading) {
    return (
      <div style={{minHeight:'100vh', background:'linear-gradient(135deg, #3d3d3d 0%, #4a4a4a 50%, #525252 100%)', display:'flex', alignItems:'center', justifyContent:'center', color:'#e5e7eb'}}>
        Loading...
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div style={{minHeight:'100vh', background:'linear-gradient(135deg, #3d3d3d 0%, #4a4a4a 50%, #525252 100%)'}}>
      <div style={{background:'rgba(0,0,0,0.3)', borderBottom:'1px solid rgba(245,158,11,0.3)', padding:'20px 32px'}}>
        <div style={{maxWidth:1200, margin:'0 auto'}}>
          <Link href="/tech/home" style={{color:'#3b82f6', textDecoration:'none', fontSize:14, fontWeight:600, marginBottom:16, display:'inline-block'}}>
            ← Back to Dashboard
          </Link>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <div>
              <h1 style={{fontSize:28, fontWeight:700, color:'#e5e7eb', marginBottom:8}}>💬 Messages</h1>
              <p style={{fontSize:14, color:'#9aa3b2'}}>Same messaging system as shop admin</p>
            </div>
          </div>
        </div>
      </div>

      <div style={{maxWidth:1200, margin:'0 auto', padding:32}}>
        <MessagingCard userId={user.id} shopId={user.shopId || ''} />
      </div>
    </div>
  );
}
