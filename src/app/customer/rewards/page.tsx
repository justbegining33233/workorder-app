'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRequireAuth } from '@/contexts/AuthContext';

interface Reward {
  id: string;
  claimed: boolean;
  name: string;
  value: string;
  description: string;
  expires: string;
  progress?: number;
  total?: number;
}

export default function Rewards() {
  useRequireAuth(['customer']);
  const [userName, setUserName] = useState('');
  const [rewards] = useState<Reward[]>([]);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);

  useEffect(() => {
    const name = localStorage.getItem('userName') || '';
    setUserName(name);

    // Derive loyalty points from completed work orders (50 pts each)
    fetch('/api/workorders', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const orders: any[] = Array.isArray(data) ? data : (data?.workOrders ?? []);
        const completed = orders.filter((w: any) =>
          ['closed', 'completed', 'Completed'].includes(w.status)
        ).length;
        setLoyaltyPoints(completed * 50);
      })
      .catch(() => {});
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    window.location.href = '/auth/login';
  };

  return (
    <div style={{minHeight:'100vh', background: 'transparent'}}>
      {/* Header */}
      <div style={{background:'rgba(0,0,0,0.3)', borderBottom:'1px solid rgba(229,51,42,0.3)', padding:'16px 32px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <div style={{display:'flex', alignItems:'center', gap:24}}>
          <Link href="/customer/dashboard" style={{fontSize:24, fontWeight:900, color:'#e5332a', textDecoration:'none'}}>FixTray</Link>
          <div>
            <div style={{fontSize:20, fontWeight:700, color:'#e5e7eb'}}>Customer Portal</div>
            <div style={{fontSize:12, color:'#9aa3b2'}}>Rewards</div>
          </div>
        </div>
        <div style={{display:'flex', alignItems:'center', gap:16}}>
          <span style={{fontSize:14, color:'#9aa3b2'}}>Welcome, {userName}</span>
          <button onClick={handleSignOut} style={{padding:'8px 16px', background:'#e5332a', color:'white', border:'none', borderRadius:6, cursor:'pointer', fontSize:13, fontWeight:600}}>
            Sign Out
          </button>
        </div>
      </div>

      <div style={{maxWidth:1200, margin:'0 auto', padding:32}}>
        <h1 style={{fontSize:32, fontWeight:700, color:'#e5e7eb', marginBottom:32}}>My Rewards</h1>

        {/* Current Points */}
        <div style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:24, marginBottom:32}}>
          <h2 style={{fontSize:24, fontWeight:700, color:'#e5e7eb', marginBottom:16}}>Current Balance</h2>
          <div style={{display:'flex', alignItems:'center', gap:24}}>
            <div>
              <div style={{fontSize:36, fontWeight:700, color:'#3b82f6'}}>{loyaltyPoints}</div>
              <div style={{fontSize:14, color:'#9aa3b2'}}>Loyalty Points</div>
            </div>
            <div style={{flex:1}}>
              {(() => {
                const nextThreshold = loyaltyPoints >= 1000 ? 1000 : loyaltyPoints >= 200 ? 1000 : 200;
                const prevThreshold = loyaltyPoints >= 1000 ? 1000 : loyaltyPoints >= 200 ? 200 : 0;
                const pct = nextThreshold > prevThreshold
                  ? Math.min(100, Math.round(((loyaltyPoints - prevThreshold) / (nextThreshold - prevThreshold)) * 100))
                  : 100;
                return (
                  <>
                    <div style={{display:'flex', justifyContent:'space-between', marginBottom:8}}>
                      <span style={{fontSize:14, color:'#e5e7eb'}}>Progress to next reward</span>
                      <span style={{fontSize:14, color:'#9aa3b2'}}>{loyaltyPoints} / {nextThreshold}</span>
                    </div>
                    <div style={{width:'100%', height:8, background:'rgba(255,255,255,0.1)', borderRadius:4}}>
                      <div style={{width:`${pct}%`, height:'100%', background:'#3b82f6', borderRadius:4}}></div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Available Rewards */}
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(350px, 1fr))', gap:24}}>
          {rewards.map(reward => (
            <div key={reward.id} style={{
              background:'rgba(0,0,0,0.3)',
              border:'1px solid rgba(255,255,255,0.1)',
              borderRadius:12,
              padding:24,
              opacity: reward.claimed ? 0.6 : 1
            }}>
              <div style={{marginBottom:16}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8}}>
                  <h3 style={{fontSize:20, fontWeight:700, color:'#e5e7eb'}}>{reward.name}</h3>
                  {reward.claimed && (
                    <span style={{padding:'4px 8px', background:'rgba(34,197,94,0.2)', color:'#22c55e', borderRadius:6, fontSize:12, fontWeight:600}}>
                      Claimed
                    </span>
                  )}
                </div>
                <div style={{fontSize:18, color:'#3b82f6', fontWeight:600, marginBottom:8}}>{reward.value}</div>
                <div style={{fontSize:14, color:'#9aa3b2', marginBottom:8}}>{reward.description}</div>
                <div style={{fontSize:12, color:'#6b7280'}}>Expires: {reward.expires}</div>
                {reward.progress && (
                  <div style={{marginTop:12}}>
                    <div style={{display:'flex', justifyContent:'space-between', marginBottom:4}}>
                      <span style={{fontSize:12, color:'#9aa3b2'}}>Progress</span>
                      <span style={{fontSize:12, color:'#9aa3b2'}}>{reward.progress} / {reward.total}</span>
                    </div>
                    <div style={{width:'100%', height:6, background:'rgba(255,255,255,0.1)', borderRadius:3}}>
                      <div style={{width:`${reward.total ? (reward.progress / reward.total) * 100 : 0}%`, height:'100%', background:'#3b82f6', borderRadius:3}}></div>
                    </div>
                  </div>
                )}
              </div>
              {!reward.claimed && (
                <button style={{
                  width:'100%',
                  padding:'12px',
                  background:'#3b82f6',
                  color:'white',
                  border:'none',
                  borderRadius:8,
                  fontSize:14,
                  fontWeight:600,
                  cursor:'pointer'
                }}>
                  {reward.progress ? 'Continue Earning' : 'Claim Reward'}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Back to Dashboard */}
        <div style={{marginTop:32, textAlign:'center'}}>
          <Link href="/customer/dashboard" style={{
            padding:'12px 24px',
            background:'#3b82f6',
            color:'white',
            border:'none',
            borderRadius:8,
            fontSize:16,
            fontWeight:600,
            textDecoration:'none',
            cursor:'pointer'
          }}>
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}