'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Appointments() {
  const [userName, setUserName] = useState('');
  const [appointments] = useState<{id: string; service: string; date: string; time: string; shop: string; vehicle: string; status: string}[]>([]);

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    const name = localStorage.getItem('userName') || '';
    setUserName(name);

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

  return (
    <div style={{minHeight:'100vh', background:'linear-gradient(135deg, #3d3d3d 0%, #4a4a4a 50%, #525252 100%)'}}>
      {/* Header */}
      <div style={{background:'rgba(0,0,0,0.3)', borderBottom:'1px solid rgba(229,51,42,0.3)', padding:'16px 32px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <div style={{display:'flex', alignItems:'center', gap:24}}>
          <Link href="/customer/dashboard" style={{fontSize:24, fontWeight:900, color:'#e5332a', textDecoration:'none'}}>FixTray</Link>
          <div>
            <div style={{fontSize:20, fontWeight:700, color:'#e5e7eb'}}>Customer Portal</div>
            <div style={{fontSize:12, color:'#9aa3b2'}}>Appointments</div>
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
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:32}}>
          <h1 style={{fontSize:32, fontWeight:700, color:'#e5e7eb'}}>My Appointments</h1>
          <button style={{
            padding:'12px 24px',
            background:'#3b82f6',
            color:'white',
            border:'none',
            borderRadius:8,
            fontSize:16,
            fontWeight:600,
            cursor:'pointer'
          }}>
            Schedule New
          </button>
        </div>

        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(400px, 1fr))', gap:24}}>
          {appointments.map(appointment => (
            <div key={appointment.id} style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:24}}>
              <div style={{marginBottom:20}}>
                <h3 style={{fontSize:20, fontWeight:700, color:'#e5e7eb', marginBottom:8}}>{appointment.service}</h3>
                <div style={{fontSize:16, color:'#3b82f6', fontWeight:600, marginBottom:4}}>{appointment.date} at {appointment.time}</div>
                <div style={{fontSize:14, color:'#9aa3b2', marginBottom:4}}>{appointment.shop}</div>
                <div style={{fontSize:14, color:'#9aa3b2', marginBottom:12}}>{appointment.vehicle}</div>
                <span style={{
                  padding:'4px 12px',
                  background: appointment.status === 'Confirmed' ? 'rgba(34,197,94,0.2)' : 'rgba(245,158,11,0.2)',
                  color: appointment.status === 'Confirmed' ? '#22c55e' : '#f59e0b',
                  borderRadius:12,
                  fontSize:12,
                  fontWeight:600
                }}>
                  {appointment.status}
                </span>
              </div>
              <div style={{display:'flex', gap:12}}>
                <button style={{
                  flex:1,
                  padding:'12px',
                  background:'#3b82f6',
                  color:'white',
                  border:'none',
                  borderRadius:8,
                  fontSize:14,
                  fontWeight:600,
                  cursor:'pointer'
                }}>
                  View Details
                </button>
                <button style={{
                  flex:1,
                  padding:'12px',
                  background:'rgba(245,158,11,0.1)',
                  color:'#f59e0b',
                  border:'1px solid rgba(245,158,11,0.3)',
                  borderRadius:8,
                  fontSize:14,
                  fontWeight:600,
                  cursor:'pointer'
                }}>
                  Reschedule
                </button>
                <button style={{
                  flex:1,
                  padding:'12px',
                  background:'rgba(239,68,68,0.1)',
                  color:'#ef4444',
                  border:'1px solid rgba(239,68,68,0.3)',
                  borderRadius:8,
                  fontSize:14,
                  fontWeight:600,
                  cursor:'pointer'
                }}>
                  Cancel
                </button>
              </div>
            </div>
          ))}
        </div>

        {appointments.length === 0 && (
          <div style={{textAlign:'center', padding:40, color:'#9aa3b2'}}>
            No appointments scheduled.
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