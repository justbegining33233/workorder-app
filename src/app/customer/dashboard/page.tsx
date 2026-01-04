'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function CustomerDashboard() {
  // Placeholder data - will be replaced with real API calls
  const [userName] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('userName') || '';
    }
    return '';
  });
  const [customerStats] = useState({
    openOrders: 0,
    completedToday: 0,
    messages: 0,
    appointments: 0
  });

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    
    if (role !== 'customer') {
      window.location.href = '/auth/login';
      return;
    }
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    window.location.href = '/auth/login';
  };

  // All portal features for dashboard quick access
  const portalFeatures = [
    { id: 'overview', icon: '📊', name: 'Overview', href: '/customer/overview' },
    { id: 'findshops', icon: '🔍', name: 'Find Shops', href: '/customer/findshops' },
    { id: 'tracking', icon: '📍', name: 'Live Tracking', href: '/customer/tracking' },
    { id: 'messages', icon: '💬', name: 'Messages', href: '/customer/messages' },
    { id: 'payments', icon: '💳', name: 'Payments', href: '/customer/payments' },
    { id: 'appointments', icon: '📅', name: 'Appointments', href: '/customer/appointments' },
    { id: 'reviews', icon: '⭐', name: 'Reviews', href: '/customer/reviews' },
    { id: 'favorites', icon: '❤️', name: 'Favorites', href: '/customer/favorites' },
    { id: 'rewards', icon: '🎁', name: 'Rewards', href: '/customer/rewards' },
    { id: 'documents', icon: '📄', name: 'Documents', href: '/customer/documents' },
    { id: 'quotes', icon: '💰', name: 'Price Quotes', href: '/customer/quotes' },
    { id: 'history', icon: '📋', name: 'Service History', href: '/customer/history' },
    { id: 'insights', icon: '📈', name: 'Insights', href: '/customer/insights' },
  ];

  return (
    <div style={{minHeight:'100vh', background:'linear-gradient(135deg, #3d3d3d 0%, #4a4a4a 50%, #525252 100%)'}}>
      {/* Header */}
      <div style={{background:'rgba(0,0,0,0.3)', borderBottom:'1px solid rgba(229,51,42,0.3)', padding:'16px 32px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <div style={{display:'flex', alignItems:'center', gap:24}}>
          <Link href="/" style={{fontSize:24, fontWeight:900, color:'#e5332a', textDecoration:'none'}}>FixTray</Link>
          <div>
            <div style={{fontSize:20, fontWeight:700, color:'#e5e7eb'}}>Customer Portal</div>
            <div style={{fontSize:12, color:'#9aa3b2'}}>Dashboard</div>
          </div>
        </div>
        <div style={{display:'flex', alignItems:'center', gap:16}}>
          <span style={{fontSize:14, color:'#9aa3b2'}}>Welcome, {userName}</span>
          <button onClick={handleSignOut} style={{padding:'8px 16px', background:'#e5332a', color:'white', border:'none', borderRadius:6, cursor:'pointer', fontSize:13, fontWeight:600}}>
            Sign Out
          </button>
        </div>
      </div>

      <div style={{maxWidth:1400, margin:'0 auto', padding:32}}>
        {/* Customer Stats */}
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:16, marginBottom:32}}>
          <div style={{background:'rgba(59,130,246,0.1)', border:'1px solid rgba(59,130,246,0.3)', borderRadius:12, padding:20}}>
            <div style={{fontSize:13, color:'#9aa3b2', marginBottom:8}}>Open Orders</div>
            <div style={{fontSize:32, fontWeight:700, color:'#3b82f6'}}>{customerStats.openOrders}</div>
          </div>
          <div style={{background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.3)', borderRadius:12, padding:20}}>
            <div style={{fontSize:13, color:'#9aa3b2', marginBottom:8}}>Completed Today</div>
            <div style={{fontSize:32, fontWeight:700, color:'#22c55e'}}>{customerStats.completedToday}</div>
          </div>
          <div style={{background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.3)', borderRadius:12, padding:20}}>
            <div style={{fontSize:13, color:'#9aa3b2', marginBottom:8}}>Messages</div>
            <div style={{fontSize:32, fontWeight:700, color:'#f59e0b'}}>{customerStats.messages}</div>
          </div>
          <div style={{background:'rgba(168,85,247,0.1)', border:'1px solid rgba(168,85,247,0.3)', borderRadius:12, padding:20}}>
            <div style={{fontSize:13, color:'#9aa3b2', marginBottom:8}}>Appointments</div>
            <div style={{fontSize:32, fontWeight:700, color:'#a855f7'}}>{customerStats.appointments}</div>
          </div>
        </div>

        {/* Portal Features Overview Cards */}
        <div style={{marginTop:40}}>
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(400px, 1fr))', gap:24}}>
            {portalFeatures.map(f => {
              // Placeholder - real data will come from API
              const data: any[] = [];

              return (
                <div key={f.id} style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:24}}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20}}>
                    <div style={{display:'flex', alignItems:'center', gap:12}}>
                      <span style={{fontSize:24}}>{f.icon}</span>
                      <h3 style={{fontSize:18, fontWeight:700, color:'#e5e7eb', margin:0}}>{f.name}</h3>
                    </div>
                    <Link href={f.href} style={{fontSize:13, color:'#3b82f6', textDecoration:'none'}}>View All →</Link>
                  </div>
                  <div style={{display:'flex', flexDirection:'column', gap:12}}>
                    {data.length > 0 ? data.slice(0, 2).map((item, idx) => (
                      <div key={idx} style={{background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:16}}>
                        {/* Real data will be rendered here */}
                      </div>
                    )) : (
                      <div style={{textAlign:'center', padding:20, color:'#9aa3b2'}}>
                        No recent {f.name.toLowerCase()}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
