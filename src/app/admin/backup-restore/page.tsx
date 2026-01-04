'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function BackupRestore() {
  const router = useRouter();
  const [backups] = useState([
    { id: 1, name: 'Daily Backup - Dec 31, 2025', size: '2.4 GB', date: '2025-12-31 03:00 AM', status: 'completed' },
    { id: 2, name: 'Daily Backup - Dec 30, 2025', size: '2.3 GB', date: '2025-12-30 03:00 AM', status: 'completed' },
    { id: 3, name: 'Daily Backup - Dec 29, 2025', size: '2.3 GB', date: '2025-12-29 03:00 AM', status: 'completed' },
  ]);

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
      <div style={{background:'rgba(0,0,0,0.3)', borderBottom:'1px solid rgba(59,130,246,0.3)', padding:'20px 32px'}}>
        <div style={{maxWidth:1400, margin:'0 auto'}}>
          <Link href="/admin/admin-tools" style={{color:'#3b82f6', textDecoration:'none', fontSize:14, fontWeight:600, marginBottom:16, display:'inline-block'}}>
            ← Back to Admin Tools
          </Link>
          <h1 style={{fontSize:28, fontWeight:700, color:'#e5e7eb', marginBottom:8}}>💾 Backup & Restore</h1>
          <p style={{fontSize:14, color:'#9aa3b2'}}>Database backup and restore operations</p>
        </div>
      </div>

      <div style={{maxWidth:1400, margin:'0 auto', padding:32}}>
        {/* Quick Actions */}
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))', gap:20, marginBottom:32}}>
          <div style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(34,197,94,0.3)', borderRadius:12, padding:24}}>
            <div style={{fontSize:40, marginBottom:12}}>💾</div>
            <h3 style={{fontSize:18, fontWeight:700, color:'#e5e7eb', marginBottom:8}}>Create Backup</h3>
            <p style={{fontSize:14, color:'#9aa3b2', marginBottom:16}}>Create a full backup of the database</p>
            <button 
              style={{width:'100%', padding:'12px', background:'#22c55e', color:'white', border:'none', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer'}}
            >
              Create Backup Now
            </button>
          </div>

          <div style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(59,130,246,0.3)', borderRadius:12, padding:24}}>
            <div style={{fontSize:40, marginBottom:12}}>🔄</div>
            <h3 style={{fontSize:18, fontWeight:700, color:'#e5e7eb', marginBottom:8}}>Restore Database</h3>
            <p style={{fontSize:14, color:'#9aa3b2', marginBottom:16}}>Restore from a previous backup</p>
            <button 
              style={{width:'100%', padding:'12px', background:'#3b82f6', color:'white', border:'none', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer'}}
            >
              Select Backup to Restore
            </button>
          </div>

          <div style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(245,158,11,0.3)', borderRadius:12, padding:24}}>
            <div style={{fontSize:40, marginBottom:12}}>⚙️</div>
            <h3 style={{fontSize:18, fontWeight:700, color:'#e5e7eb', marginBottom:8}}>Schedule Backups</h3>
            <p style={{fontSize:14, color:'#9aa3b2', marginBottom:16}}>Configure automatic backup schedule</p>
            <button 
              style={{width:'100%', padding:'12px', background:'#f59e0b', color:'white', border:'none', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer'}}
            >
              Configure Schedule
            </button>
          </div>
        </div>

        {/* Backup Settings */}
        <div style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:24, marginBottom:24}}>
          <h2 style={{fontSize:20, fontWeight:700, color:'#e5e7eb', marginBottom:20}}>Backup Settings</h2>
          <div style={{display:'grid', gap:16}}>
            <label style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:12, background:'rgba(255,255,255,0.05)', borderRadius:8, cursor:'pointer'}}>
              <div>
                <div style={{fontSize:14, color:'#e5e7eb', fontWeight:600}}>Automatic Daily Backups</div>
                <div style={{fontSize:12, color:'#9aa3b2'}}>Run backup every day at 3:00 AM</div>
              </div>
              <input type="checkbox" defaultChecked style={{width:20, height:20, cursor:'pointer'}} />
            </label>
            <label style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:12, background:'rgba(255,255,255,0.05)', borderRadius:8, cursor:'pointer'}}>
              <div>
                <div style={{fontSize:14, color:'#e5e7eb', fontWeight:600}}>Cloud Storage</div>
                <div style={{fontSize:12, color:'#9aa3b2'}}>Upload backups to cloud storage</div>
              </div>
              <input type="checkbox" defaultChecked style={{width:20, height:20, cursor:'pointer'}} />
            </label>
            <div>
              <label style={{display:'block', fontSize:14, color:'#9aa3b2', marginBottom:8}}>Retention Period (days)</label>
              <input 
                type="number" 
                defaultValue="30"
                min="7"
                max="365"
                style={{width:'100%', padding:'12px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#e5e7eb', fontSize:14}}
              />
            </div>
          </div>
        </div>

        {/* Backup History */}
        <div style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:24}}>
          <h2 style={{fontSize:20, fontWeight:700, color:'#e5e7eb', marginBottom:20}}>Backup History</h2>
          <div style={{display:'flex', flexDirection:'column', gap:12}}>
            {backups.map((backup) => (
              <div key={backup.id} style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:16, background:'rgba(255,255,255,0.05)', borderRadius:8}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:14, fontWeight:600, color:'#e5e7eb', marginBottom:4}}>{backup.name}</div>
                  <div style={{fontSize:12, color:'#9aa3b2'}}>
                    Size: {backup.size} • Created: {backup.date}
                  </div>
                </div>
                <div style={{display:'flex', gap:8}}>
                  <button 
                    style={{padding:'8px 16px', background:'rgba(34,197,94,0.2)', color:'#22c55e', border:'1px solid rgba(34,197,94,0.3)', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer'}}
                  >
                    ✓ {backup.status}
                  </button>
                  <button 
                    style={{padding:'8px 16px', background:'rgba(59,130,246,0.2)', color:'#3b82f6', border:'1px solid rgba(59,130,246,0.3)', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer'}}
                  >
                    Download
                  </button>
                  <button 
                    style={{padding:'8px 16px', background:'rgba(229,51,42,0.2)', color:'#e5332a', border:'1px solid rgba(229,51,42,0.3)', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer'}}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
