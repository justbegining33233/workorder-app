'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function TechCustomers() {
  const router = useRouter();

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    if (role !== 'tech' && role !== 'manager') {
      router.push('/auth/login');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{minHeight:'100vh', background:'linear-gradient(135deg, #3d3d3d 0%, #4a4a4a 50%, #525252 100%)'}}>
      <div style={{background:'rgba(0,0,0,0.3)', borderBottom:'1px solid rgba(245,158,11,0.3)', padding:'20px 32px'}}>
        <div style={{maxWidth:1200, margin:'0 auto'}}>
          <Link href="/tech/all-tools" style={{color:'#3b82f6', textDecoration:'none', fontSize:14, fontWeight:600, marginBottom:16, display:'inline-block'}}>
            ← Back to Tools
          </Link>
          <h1 style={{fontSize:28, fontWeight:700, color:'#e5e7eb', marginBottom:8}}>👥 Customer Portal</h1>
          <p style={{fontSize:14, color:'#9aa3b2'}}>Access customer information, history, and contact details</p>
        </div>
      </div>

      <div style={{maxWidth:1200, margin:'0 auto', padding:32}}>
        <div style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:32, textAlign:'center'}}>
          <div style={{fontSize:64, marginBottom:16}}>👥</div>
          <h2 style={{fontSize:24, fontWeight:700, color:'#e5e7eb', marginBottom:16}}>Customer Management</h2>
          <p style={{fontSize:16, color:'#9aa3b2', marginBottom:24}}>Customer database and history coming soon.</p>
          <Link href="/workorders/list" style={{color:'#3b82f6', textDecoration:'none', fontSize:14, fontWeight:600}}>
            View Work Orders →
          </Link>
        </div>
      </div>
    </div>
  );
}
