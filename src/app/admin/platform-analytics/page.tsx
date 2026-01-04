'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function PlatformAnalytics() {
  const router = useRouter();

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    const isSuperAdmin = localStorage.getItem('isSuperAdmin');
    if (role !== 'admin' || isSuperAdmin !== 'true') {
      router.push('/auth/login');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{minHeight:'100vh', background:'linear-gradient(135deg, #3d3d3d 0%, #4a4a4a 50%, #525252 100%)'}}>
      <div style={{background:'rgba(0,0,0,0.3)', borderBottom:'1px solid rgba(245,158,11,0.3)', padding:'20px 32px'}}>
        <div style={{maxWidth:1400, margin:'0 auto'}}>
          <Link href="/admin/admin-tools" style={{color:'#3b82f6', textDecoration:'none', fontSize:14, fontWeight:600, marginBottom:16, display:'inline-block'}}>
            ← Back to Admin Tools
          </Link>
          <h1 style={{fontSize:28, fontWeight:700, color:'#e5e7eb', marginBottom:8}}>📊 Platform Analytics</h1>
          <p style={{fontSize:14, color:'#9aa3b2'}}>Detailed analytics and performance metrics</p>
        </div>
      </div>

      <div style={{maxWidth:1400, margin:'0 auto', padding:32}}>
        {/* Key Metrics */}
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(250px, 1fr))', gap:20, marginBottom:32}}>
          <div style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(34,197,94,0.3)', borderRadius:12, padding:24}}>
            <div style={{fontSize:13, color:'#9aa3b2', marginBottom:8}}>Total Revenue</div>
            <div style={{fontSize:32, fontWeight:700, color:'#22c55e', marginBottom:8}}>$0</div>
            <div style={{fontSize:12, color:'#22c55e'}}>↑ 0% from last month</div>
          </div>
          <div style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(59,130,246,0.3)', borderRadius:12, padding:24}}>
            <div style={{fontSize:13, color:'#9aa3b2', marginBottom:8}}>Active Users</div>
            <div style={{fontSize:32, fontWeight:700, color:'#3b82f6', marginBottom:8}}>0</div>
            <div style={{fontSize:12, color:'#3b82f6'}}>↑ 0% from last month</div>
          </div>
          <div style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(168,85,247,0.3)', borderRadius:12, padding:24}}>
            <div style={{fontSize:13, color:'#9aa3b2', marginBottom:8}}>Work Orders</div>
            <div style={{fontSize:32, fontWeight:700, color:'#a855f7', marginBottom:8}}>0</div>
            <div style={{fontSize:12, color:'#a855f7'}}>↑ 0% from last month</div>
          </div>
          <div style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(245,158,11,0.3)', borderRadius:12, padding:24}}>
            <div style={{fontSize:13, color:'#9aa3b2', marginBottom:8}}>Avg Response Time</div>
            <div style={{fontSize:32, fontWeight:700, color:'#f59e0b', marginBottom:8}}>0h</div>
            <div style={{fontSize:12, color:'#22c55e'}}>↓ 0% faster</div>
          </div>
        </div>

        <div style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap:24}}>
          {/* Revenue Chart */}
          <div style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:24}}>
            <h2 style={{fontSize:20, fontWeight:700, color:'#e5e7eb', marginBottom:20}}>Revenue Trends</h2>
            <div style={{height:300, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(255,255,255,0.03)', borderRadius:8}}>
              <div style={{textAlign:'center', color:'#9aa3b2'}}>
                <div style={{fontSize:48, marginBottom:12}}>📈</div>
                <div>Chart visualization would go here</div>
              </div>
            </div>
          </div>

          {/* Top Shops */}
          <div style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:24}}>
            <h2 style={{fontSize:20, fontWeight:700, color:'#e5e7eb', marginBottom:20}}>Top Performing Shops</h2>
            <div style={{display:'flex', flexDirection:'column', gap:12}}>
              {[1,2,3,4,5].map((i) => (
                <div key={i} style={{padding:12, background:'rgba(255,255,255,0.05)', borderRadius:8}}>
                  <div style={{fontSize:14, fontWeight:600, color:'#e5e7eb', marginBottom:4}}>Shop #{i}</div>
                  <div style={{fontSize:12, color:'#9aa3b2'}}>$0 revenue</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* User Activity */}
        <div style={{marginTop:24, background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:24}}>
          <h2 style={{fontSize:20, fontWeight:700, color:'#e5e7eb', marginBottom:20}}>User Activity</h2>
          <div style={{height:250, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(255,255,255,0.03)', borderRadius:8}}>
            <div style={{textAlign:'center', color:'#9aa3b2'}}>
              <div style={{fontSize:48, marginBottom:12}}>📊</div>
              <div>Activity chart would go here</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
