'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SystemSettings() {
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
      <div style={{background:'rgba(0,0,0,0.3)', borderBottom:'1px solid rgba(107,114,128,0.3)', padding:'20px 32px'}}>
        <div style={{maxWidth:1400, margin:'0 auto'}}>
          <Link href="/admin/admin-tools" style={{color:'#3b82f6', textDecoration:'none', fontSize:14, fontWeight:600, marginBottom:16, display:'inline-block'}}>
            ← Back to Admin Tools
          </Link>
          <h1 style={{fontSize:28, fontWeight:700, color:'#e5e7eb', marginBottom:8}}>⚙️ System Settings</h1>
          <p style={{fontSize:14, color:'#9aa3b2'}}>Configure platform settings and preferences</p>
        </div>
      </div>

      <div style={{maxWidth:1400, margin:'0 auto', padding:32}}>
        <div style={{display:'grid', gap:24}}>
          {/* General Settings */}
          <div style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:24}}>
            <h2 style={{fontSize:20, fontWeight:700, color:'#e5e7eb', marginBottom:20}}>General Settings</h2>
            <div style={{display:'grid', gap:16}}>
              <div>
                <label style={{display:'block', fontSize:14, color:'#9aa3b2', marginBottom:8}}>Platform Name</label>
                <input 
                  type="text" 
                  defaultValue="FixTray"
                  style={{width:'100%', padding:'12px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#e5e7eb', fontSize:14}}
                />
              </div>
              <div>
                <label style={{display:'block', fontSize:14, color:'#9aa3b2', marginBottom:8}}>Support Email</label>
                <input 
                  type="email" 
                  defaultValue="support@fixtray.com"
                  style={{width:'100%', padding:'12px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#e5e7eb', fontSize:14}}
                />
              </div>
              <div>
                <label style={{display:'block', fontSize:14, color:'#9aa3b2', marginBottom:8}}>Timezone</label>
                <select 
                  defaultValue="America/New_York"
                  style={{width:'100%', padding:'12px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#e5e7eb', fontSize:14}}
                >
                  <option value="America/New_York">Eastern Time (ET)</option>
                  <option value="America/Chicago">Central Time (CT)</option>
                  <option value="America/Denver">Mountain Time (MT)</option>
                  <option value="America/Los_Angeles">Pacific Time (PT)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Feature Toggles */}
          <div style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:24}}>
            <h2 style={{fontSize:20, fontWeight:700, color:'#e5e7eb', marginBottom:20}}>Feature Toggles</h2>
            <div style={{display:'grid', gap:16}}>
              <label style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:12, background:'rgba(255,255,255,0.05)', borderRadius:8, cursor:'pointer'}}>
                <span style={{fontSize:14, color:'#e5e7eb'}}>Enable Shop Registration</span>
                <input type="checkbox" defaultChecked style={{width:20, height:20, cursor:'pointer'}} />
              </label>
              <label style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:12, background:'rgba(255,255,255,0.05)', borderRadius:8, cursor:'pointer'}}>
                <span style={{fontSize:14, color:'#e5e7eb'}}>Enable Customer Portal</span>
                <input type="checkbox" defaultChecked style={{width:20, height:20, cursor:'pointer'}} />
              </label>
              <label style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:12, background:'rgba(255,255,255,0.05)', borderRadius:8, cursor:'pointer'}}>
                <span style={{fontSize:14, color:'#e5e7eb'}}>Enable Email Notifications</span>
                <input type="checkbox" defaultChecked style={{width:20, height:20, cursor:'pointer'}} />
              </label>
              <label style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:12, background:'rgba(255,255,255,0.05)', borderRadius:8, cursor:'pointer'}}>
                <span style={{fontSize:14, color:'#e5e7eb'}}>Maintenance Mode</span>
                <input type="checkbox" style={{width:20, height:20, cursor:'pointer'}} />
              </label>
            </div>
          </div>

          {/* Save Button */}
          <div style={{display:'flex', justifyContent:'flex-end', gap:12}}>
            <button 
              style={{padding:'12px 24px', background:'rgba(255,255,255,0.1)', color:'#e5e7eb', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer'}}
            >
              Cancel
            </button>
            <button 
              style={{padding:'12px 24px', background:'#22c55e', color:'white', border:'none', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer'}}
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
