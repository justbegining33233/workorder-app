'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CustomerHome() {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [currentJobs, setCurrentJobs] = useState<{id: string; service: string; shop: string; status: string; eta: string; progress: number; date: string}[]>([]);
  const [pastJobs, setPastJobs] = useState<{id: string; service: string; shop: string; status: string; date: string; cost: string; rating: number}[]>([]);
  const [messages, setMessages] = useState<{unread: boolean; from: string; message: string; time: string}[]>([]);

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    const name = localStorage.getItem('userName');
    
    if (role !== 'customer') {
      router.push('/auth/login');
      return;
    }
    
    if (name) setUserName(name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    router.push('/auth/login');
  };

  return (
    <div style={{minHeight:'100vh', background:'linear-gradient(135deg, #3d3d3d 0%, #4a4a4a 50%, #525252 100%)'}}>
      {/* Header */}
      <div style={{background:'rgba(0,0,0,0.3)', borderBottom:'1px solid rgba(229,51,42,0.3)', padding:'16px 32px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <div style={{display:'flex', alignItems:'center', gap:24}}>
          <Link href="/" style={{fontSize:24, fontWeight:900, color:'#e5332a', textDecoration:'none'}}>SOS</Link>
          <span style={{fontSize:20, fontWeight:700, color:'#e5e7eb'}}>Customer Home</span>
        </div>
        <div style={{display:'flex', alignItems:'center', gap:16}}>
          <span style={{fontSize:14, color:'#9aa3b2'}}>Welcome, {userName}</span>
          <button onClick={handleSignOut} style={{padding:'8px 16px', background:'#e5332a', color:'white', border:'none', borderRadius:6, cursor:'pointer', fontSize:13, fontWeight:600}}>
            Sign Out
          </button>
        </div>
      </div>

      <div style={{maxWidth:1400, margin:'0 auto', padding:32}}>
        {/* Quick Stats */}
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:16, marginBottom:32}}>
          <div style={{background:'rgba(59,130,246,0.1)', border:'1px solid rgba(59,130,246,0.3)', borderRadius:12, padding:20}}>
            <div style={{fontSize:13, color:'#9aa3b2', marginBottom:8}}>Active Jobs</div>
            <div style={{fontSize:32, fontWeight:700, color:'#3b82f6'}}>{currentJobs.length}</div>
          </div>
          <div style={{background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.3)', borderRadius:12, padding:20}}>
            <div style={{fontSize:13, color:'#9aa3b2', marginBottom:8}}>Completed Jobs</div>
            <div style={{fontSize:32, fontWeight:700, color:'#22c55e'}}>{pastJobs.length}</div>
          </div>
          <div style={{background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.3)', borderRadius:12, padding:20}}>
            <div style={{fontSize:13, color:'#9aa3b2', marginBottom:8}}>Unread Messages</div>
            <div style={{fontSize:32, fontWeight:700, color:'#f59e0b'}}>{messages.filter(m => m.unread).length}</div>
          </div>
          <div style={{background:'rgba(229,51,42,0.1)', border:'1px solid rgba(229,51,42,0.3)', borderRadius:12, padding:20}}>
            <div style={{fontSize:13, color:'#9aa3b2', marginBottom:8}}>Total Spent</div>
            <div style={{fontSize:32, fontWeight:700, color:'#e5332a'}}>$615</div>
          </div>
        </div>

        <div style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap:24}}>
          {/* Left Column */}
          <div>
            {/* Current Jobs */}
            <div style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:24, marginBottom:24}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20}}>
                <h2 style={{fontSize:20, fontWeight:700, color:'#e5e7eb'}}>Current Jobs</h2>
                <Link href="/customer/features?tab=workorders" style={{fontSize:13, color:'#3b82f6', textDecoration:'none'}}>View All →</Link>
              </div>
              <div style={{display:'flex', flexDirection:'column', gap:12}}>
                {currentJobs.map(job => (
                  <div key={job.id} style={{background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:16}}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12}}>
                      <div>
                        <div style={{fontSize:15, fontWeight:700, color:'#e5e7eb', marginBottom:4}}>{job.service}</div>
                        <div style={{fontSize:13, color:'#9aa3b2'}}>{job.shop} • {job.id}</div>
                      </div>
                      <span style={{padding:'4px 12px', background:job.status === 'In Progress' ? 'rgba(34,197,94,0.2)' : 'rgba(59,130,246,0.2)', color:job.status === 'In Progress' ? '#22c55e' : '#3b82f6', borderRadius:12, fontSize:12, fontWeight:600}}>
                        {job.status}
                      </span>
                    </div>
                    {job.status === 'In Progress' ? (
                      <>
                        <div style={{fontSize:13, color:'#9aa3b2', marginBottom:8}}>ETA: {job.eta}</div>
                        <div style={{width:'100%', height:8, background:'rgba(255,255,255,0.1)', borderRadius:4, overflow:'hidden'}}>
                          <div style={{width:`${job.progress}%`, height:'100%', background:'linear-gradient(90deg, #22c55e, #16a34a)', transition:'width 0.3s'}} />
                        </div>
                      </>
                    ) : (
                      <div style={{fontSize:13, color:'#9aa3b2'}}>Scheduled: {job.date}</div>
                    )}
                  </div>
                ))}
              </div>
              <Link href="/workorders/new">
                <button style={{width:'100%', marginTop:16, padding:'12px', background:'#e5332a', color:'white', border:'none', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer'}}>
                  + Request New Service
                </button>
              </Link>
            </div>

            {/* Past Jobs */}
            <div style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:24}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20}}>
                <h2 style={{fontSize:20, fontWeight:700, color:'#e5e7eb'}}>Past Jobs</h2>
                <Link href="/customer/features?tab=history" style={{fontSize:13, color:'#3b82f6', textDecoration:'none'}}>View All →</Link>
              </div>
              <div style={{display:'flex', flexDirection:'column', gap:12}}>
                {pastJobs.map(job => (
                  <div key={job.id} style={{background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:16}}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8}}>
                      <div>
                        <div style={{fontSize:15, fontWeight:700, color:'#e5e7eb', marginBottom:4}}>{job.service}</div>
                        <div style={{fontSize:13, color:'#9aa3b2'}}>{job.shop} • {job.date}</div>
                      </div>
                      <div style={{fontSize:15, fontWeight:700, color:'#22c55e'}}>{job.cost}</div>
                    </div>
                    <div style={{display:'flex', alignItems:'center', gap:4}}>
                      {[...Array(5)].map((_, i) => (
                        <span key={i} style={{color: i < job.rating ? '#f59e0b' : '#4b5563', fontSize:16}}>★</span>
                      ))}
                      <span style={{fontSize:12, color:'#9aa3b2', marginLeft:8}}>Your Rating</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div>
            {/* Messages */}
            <div style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:24, marginBottom:24}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20}}>
                <h2 style={{fontSize:20, fontWeight:700, color:'#e5e7eb'}}>Messages</h2>
                <span style={{padding:'4px 8px', background:'#e5332a', color:'white', borderRadius:12, fontSize:11, fontWeight:700}}>
                  {messages.filter(m => m.unread).length}
                </span>
              </div>
              <div style={{display:'flex', flexDirection:'column', gap:12}}>
                {messages.map((msg, idx) => (
                  <div key={idx} style={{background:msg.unread ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.05)', border:`1px solid ${msg.unread ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.1)'}`, borderRadius:8, padding:12}}>
                    <div style={{fontSize:13, fontWeight:700, color:'#e5e7eb', marginBottom:4}}>{msg.from}</div>
                    <div style={{fontSize:12, color:'#9aa3b2', marginBottom:4}}>{msg.message}</div>
                    <div style={{fontSize:11, color:'#6b7280'}}>{msg.time}</div>
                  </div>
                ))}
              </div>
              <Link href="/customer/features?tab=messages">
                <button style={{width:'100%', marginTop:16, padding:'10px', background:'rgba(59,130,246,0.2)', color:'#3b82f6', border:'1px solid rgba(59,130,246,0.3)', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer'}}>
                  View All Messages
                </button>
              </Link>
            </div>

            {/* Quick Actions */}
            <div style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:24}}>
              <h2 style={{fontSize:20, fontWeight:700, color:'#e5e7eb', marginBottom:20}}>Quick Actions</h2>
              <div style={{display:'flex', flexDirection:'column', gap:12}}>
                <Link href="/customer/features?tab=findshops">
                  <button style={{width:'100%', padding:'12px', background:'rgba(59,130,246,0.2)', color:'#3b82f6', border:'1px solid rgba(59,130,246,0.3)', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', textAlign:'left'}}>
                    🔍 Find Shops Near Me
                  </button>
                </Link>
                <Link href="/customer/features?tab=payments">
                  <button style={{width:'100%', padding:'12px', background:'rgba(34,197,94,0.2)', color:'#22c55e', border:'1px solid rgba(34,197,94,0.3)', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', textAlign:'left'}}>
                    💳 Payment History
                  </button>
                </Link>
                <Link href="/customer/features?tab=appointments">
                  <button style={{width:'100%', padding:'12px', background:'rgba(245,158,11,0.2)', color:'#f59e0b', border:'1px solid rgba(245,158,11,0.3)', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', textAlign:'left'}}>
                    📅 Manage Appointments
                  </button>
                </Link>
                <Link href="/customer/features?tab=vehicles">
                  <button style={{width:'100%', padding:'12px', background:'rgba(168,85,247,0.2)', color:'#a855f7', border:'1px solid rgba(168,85,247,0.3)', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', textAlign:'left'}}>
                    🚗 My Vehicles
                  </button>
                </Link>
                <Link href="/customer/features">
                  <button style={{width:'100%', padding:'12px', background:'rgba(229,51,42,0.2)', color:'#e5332a', border:'1px solid rgba(229,51,42,0.3)', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', textAlign:'left'}}>
                    ⚙️ All Features
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
