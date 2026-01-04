'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import TimeClock from '@/components/TimeClock';

export default function TechHome() {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState('');
  const [shopId, setShopId] = useState('');
  const [shopName, setShopName] = useState('');
  const [todayJobs, setTodayJobs] = useState<any[]>([]);
  const [shopStats] = useState({
    openJobs: 0,
    completedToday: 0,
    partsOrdered: 0,
    revenue: '$0'
  });

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    const name = localStorage.getItem('userName');
    const id = localStorage.getItem('userId');
    const shop = localStorage.getItem('shopId');
    
    if (role !== 'tech') {
      router.push('/auth/login');
      return;
    }
    
    setUserName(name || '');
    setUserId(id || '');
    setShopId(shop || '');
    
    if (shop) {
      fetchShopName(shop);
    }
    
    // Fetch assigned work orders
    fetchTodayJobs(id || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchShopName = async (shop: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/shop?shopId=${shop}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const { shop: shopData } = await response.json();
        setShopName(shopData.shopName || 'Shop');
      }
    } catch (error) {
      console.error('Error fetching shop name:', error);
    }
  };

  const fetchTodayJobs = async (techId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/workorders?assignedTo=${techId}&status=in-progress,assigned`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const { workOrders } = await response.json();
        setTodayJobs(workOrders || []);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('userId');
    localStorage.removeItem('shopId');
    localStorage.removeItem('token');
    router.push('/auth/login');
  };

  return (
    <div style={{minHeight:'100vh', background:'linear-gradient(135deg, #3d3d3d 0%, #4a4a4a 50%, #525252 100%)'}}>
      {/* Header */}
      <div style={{background:'rgba(0,0,0,0.3)', borderBottom:'1px solid rgba(229,51,42,0.3)', padding:'16px 32px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <div style={{display:'flex', alignItems:'center', gap:24}}>
          <Link href="/" style={{fontSize:24, fontWeight:900, color:'#e5332a', textDecoration:'none'}}>SOS</Link>
          <div>
            <div style={{fontSize:20, fontWeight:700, color:'#e5e7eb'}} suppressHydrationWarning>{shopName || 'Loading...'}</div>
            <div style={{fontSize:12, color:'#9aa3b2'}}>Tech Dashboard</div>
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
        {/* Shop Stats */}
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:16, marginBottom:32}}>
          <div style={{background:'rgba(59,130,246,0.1)', border:'1px solid rgba(59,130,246,0.3)', borderRadius:12, padding:20}}>
            <div style={{fontSize:13, color:'#9aa3b2', marginBottom:8}}>My Open Jobs</div>
            <div style={{fontSize:32, fontWeight:700, color:'#3b82f6'}}>{todayJobs.length}</div>
          </div>
          <div style={{background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.3)', borderRadius:12, padding:20}}>
            <div style={{fontSize:13, color:'#9aa3b2', marginBottom:8}}>Completed Today</div>
            <div style={{fontSize:32, fontWeight:700, color:'#22c55e'}}>{shopStats.completedToday}</div>
          </div>
          <div style={{background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.3)', borderRadius:12, padding:20}}>
            <div style={{fontSize:13, color:'#9aa3b2', marginBottom:8}}>Parts Ordered</div>
            <div style={{fontSize:32, fontWeight:700, color:'#f59e0b'}}>{shopStats.partsOrdered}</div>
          </div>
          <div style={{background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.3)', borderRadius:12, padding:20}}>
            <div style={{fontSize:13, color:'#9aa3b2', marginBottom:8}}>Today's Revenue</div>
            <div style={{fontSize:32, fontWeight:700, color:'#22c55e'}}>{shopStats.revenue}</div>
          </div>
        </div>

        <div style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap:24}}>
          {/* Left Column - Today's Tasks */}
          <div>
            <div style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:24}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20}}>
                <h2 style={{fontSize:20, fontWeight:700, color:'#e5e7eb'}}>🔧 My Tasks Today</h2>
                <Link href="/workorders/list" style={{fontSize:13, color:'#3b82f6', textDecoration:'none'}}>View All →</Link>
              </div>
              
              {todayJobs.length === 0 ? (
                <div style={{textAlign:'center', padding:48, color:'#9aa3b2'}}>
                  <div style={{fontSize:48, marginBottom:16}}>✅</div>
                  <div style={{fontSize:18, fontWeight:600, marginBottom:8}}>All caught up!</div>
                  <div style={{fontSize:14}}>No work orders assigned yet</div>
                </div>
              ) : (
                <div style={{display:'flex', flexDirection:'column', gap:12}}>
                  {todayJobs.map(job => (
                    <div key={job.id} style={{background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:16}}>
                      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12}}>
                        <div style={{flex:1}}>
                          <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:4}}>
                            <span style={{fontSize:15, fontWeight:700, color:'#e5e7eb'}}>{job.vehicleType || 'Vehicle Service'}</span>
                            <span style={{
                              padding:'2px 8px',
                              borderRadius:8,
                              fontSize:11,
                              fontWeight:700,
                              background: job.status === 'in-progress' ? 'rgba(34,197,94,0.2)' : 'rgba(59,130,246,0.2)',
                              color: job.status === 'in-progress' ? '#22c55e' : '#3b82f6',
                            }}>
                              {job.status.toUpperCase()}
                            </span>
                          </div>
                          <div style={{fontSize:13, color:'#9aa3b2', marginBottom:4}}>
                            {job.issueDescription?.substring(0, 80)}...
                          </div>
                          <div style={{fontSize:12, color:'#6b7280'}}>
                            WO-{job.id.substring(0, 8)} • {new Date(job.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <Link
                          href={`/workorders/${job.id}`}
                          style={{
                            padding:'6px 12px',
                            background:'#3b82f6',
                            color:'white',
                            borderRadius:6,
                            textDecoration:'none',
                            fontSize:12,
                            fontWeight:600,
                          }}
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div>
            {/* Time Clock */}
            <TimeClock techId={userId} shopId={shopId} techName={userName} />

            {/* Quick Tools */}
            <div style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:24, marginTop:24}}>
              <h3 style={{color:'#e5e7eb', marginBottom:16, fontSize:16}}>🛠️ Quick Tools</h3>
              <div style={{display:'grid', gap:8}}>
                <Link href="/tech/diagnostics" style={{padding:12, background:'rgba(59,130,246,0.1)', borderRadius:8, textDecoration:'none', color:'#3b82f6', fontSize:14, fontWeight:600}}>
                  🔍 Diagnostics
                </Link>
                <Link href="/tech/inventory" style={{padding:12, background:'rgba(34,197,94,0.1)', borderRadius:8, textDecoration:'none', color:'#22c55e', fontSize:14, fontWeight:600}}>
                  📦 Inventory
                </Link>
                <Link href="/tech/manuals" style={{padding:12, background:'rgba(168,85,247,0.1)', borderRadius:8, textDecoration:'none', color:'#a855f7', fontSize:14, fontWeight:600}}>
                  📖 Manuals
                </Link>
                <Link href="/tech/photos" style={{padding:12, background:'rgba(245,158,11,0.1)', borderRadius:8, textDecoration:'none', color:'#f59e0b', fontSize:14, fontWeight:600}}>
                  📸 Photos
                </Link>
              </div>
            </div>

            {/* View Center Control */}
            <div style={{background:'rgba(229,51,42,0.1)', border:'1px solid rgba(229,51,42,0.3)', borderRadius:12, padding:20, marginTop:24, textAlign:'center'}}>
              <div style={{fontSize:14, color:'#e5332a', fontWeight:600, marginBottom:8}}>📊 Shop Overview</div>
              <Link
                href="/shop/home"
                style={{
                  display:'block',
                  padding:10,
                  background:'#e5332a',
                  color:'white',
                  borderRadius:6,
                  textDecoration:'none',
                  fontSize:13,
                  fontWeight:600,
                }}
              >
                View Center Control
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
