'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRequireAuth } from '@/contexts/AuthContext';

interface HistoryItem {
  id: string;
  service: string;
  shop: string;
  vehicle: string;
  date: string;
  cost: number;
  rating: number;
  status: string;
}

export default function History() {
  useRequireAuth(['customer']);
  const [userName, setUserName] = useState('');
  const [history] = useState<HistoryItem[]>([]);

  useEffect(() => {
    const name = localStorage.getItem('userName') || '';
    setUserName(name);
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    window.location.href = '/auth/login';
  };

  const renderStars = (rating: number) => {
    return '⭐'.repeat(rating);
  };

  return (
    <div style={{minHeight:'100vh', background:'linear-gradient(135deg, #3d3d3d 0%, #4a4a4a 50%, #525252 100%)'}}>
      {/* Header */}
      <div style={{background:'rgba(0,0,0,0.3)', borderBottom:'1px solid rgba(229,51,42,0.3)', padding:'16px 32px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <div style={{display:'flex', alignItems:'center', gap:24}}>
          <Link href="/customer/dashboard" style={{fontSize:24, fontWeight:900, color:'#e5332a', textDecoration:'none'}}>FixTray</Link>
          <div>
            <div style={{fontSize:20, fontWeight:700, color:'#e5e7eb'}}>Customer Portal</div>
            <div style={{fontSize:12, color:'#9aa3b2'}}>Service History</div>
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
        <h1 style={{fontSize:32, fontWeight:700, color:'#e5e7eb', marginBottom:32}}>Service History</h1>

        <div style={{display:'flex', flexDirection:'column', gap:16}}>
          {history.map(item => (
            <div key={item.id} style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:24}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16}}>
                <div>
                  <h3 style={{fontSize:20, fontWeight:700, color:'#e5e7eb', marginBottom:4}}>{item.service}</h3>
                  <div style={{fontSize:16, color:'#3b82f6', fontWeight:600, marginBottom:4}}>{item.shop}</div>
                  <div style={{fontSize:14, color:'#9aa3b2', marginBottom:4}}>{item.vehicle} • {item.date}</div>
                  <div style={{fontSize:14, color:'#9aa3b2', marginBottom:8}}>${item.cost.toFixed(2)}</div>
                  <div style={{fontSize:16, marginBottom:8}}>{renderStars(item.rating)}</div>
                </div>
                <span style={{
                  padding:'6px 12px',
                  background:'rgba(34,197,94,0.2)',
                  color:'#22c55e',
                  borderRadius:12,
                  fontSize:12,
                  fontWeight:600
                }}>
                  {item.status}
                </span>
              </div>
              <div style={{display:'flex', gap:12}}>
                <button style={{
                  padding:'8px 16px',
                  background:'#3b82f6',
                  color:'white',
                  border:'none',
                  borderRadius:6,
                  fontSize:14,
                  fontWeight:600,
                  cursor:'pointer'
                }}>
                  View Details
                </button>
                <button style={{
                  padding:'8px 16px',
                  background:'rgba(245,158,11,0.1)',
                  color:'#f59e0b',
                  border:'1px solid rgba(245,158,11,0.3)',
                  borderRadius:6,
                  fontSize:14,
                  fontWeight:600,
                  cursor:'pointer'
                }}>
                  Book Again
                </button>
                <button style={{
                  padding:'8px 16px',
                  background:'rgba(168,85,247,0.1)',
                  color:'#a855f7',
                  border:'1px solid rgba(168,85,247,0.3)',
                  borderRadius:6,
                  fontSize:14,
                  fontWeight:600,
                  cursor:'pointer'
                }}>
                  Download Invoice
                </button>
              </div>
            </div>
          ))}
        </div>

        {history.length === 0 && (
          <div style={{textAlign:'center', padding:40, color:'#9aa3b2'}}>
            No service history available.
          </div>
        )}

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