'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Message {
  id: string;
  unread: boolean;
  from: string;
  subject: string;
  message: string;
  time: string;
}

export default function Messages() {
  const [userName, setUserName] = useState('');
  const [messages] = useState<Message[]>([]);

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

      <div style={{maxWidth:1200, margin:'0 auto', padding:32}}>
        <h1 style={{fontSize:32, fontWeight:700, color:'#e5e7eb', marginBottom:32}}>Messages</h1>

        <div style={{display:'flex', flexDirection:'column', gap:16}}>
          {messages.map(message => (
            <div key={message.id} style={{
              background:'rgba(0,0,0,0.3)',
              border:'1px solid rgba(255,255,255,0.1)',
              borderRadius:12,
              padding:24,
              opacity: message.unread ? 1 : 0.8
            }}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12}}>
                <div style={{flex:1}}>
                  <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:4}}>
                    <span style={{fontSize:16, fontWeight:700, color:'#e5e7eb'}}>{message.from}</span>
                    {message.unread && <span style={{width:8, height:8, background:'#3b82f6', borderRadius:'50%'}}></span>}
                  </div>
                  <div style={{fontSize:18, fontWeight:600, color:'#e5e7eb', marginBottom:8}}>{message.subject}</div>
                  <div style={{fontSize:14, color:'#9aa3b2', lineHeight:1.5}}>{message.message}</div>
                </div>
                <div style={{fontSize:12, color:'#6b7280', textAlign:'right'}}>
                  {message.time}
                </div>
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
                  Reply
                </button>
                <button style={{
                  padding:'8px 16px',
                  background:'rgba(34,197,94,0.1)',
                  color:'#22c55e',
                  border:'1px solid rgba(34,197,94,0.3)',
                  borderRadius:6,
                  fontSize:14,
                  fontWeight:600,
                  cursor:'pointer'
                }}>
                  Mark as Read
                </button>
              </div>
            </div>
          ))}
        </div>

        {messages.length === 0 && (
          <div style={{textAlign:'center', padding:40, color:'#9aa3b2'}}>
            No messages yet.
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