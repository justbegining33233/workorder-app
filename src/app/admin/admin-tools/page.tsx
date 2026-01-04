'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminTools() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalRevenue: '$0',
    activeShops: 0,
    totalUsers: 0,
    pendingApprovals: 0
  });

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    const isSuperAdmin = localStorage.getItem('isSuperAdmin');
    if (role !== 'admin' || isSuperAdmin !== 'true') {
      router.push('/auth/login');
      return;
    }
    
    // Fetch platform statistics
    fetch('/api/admin/stats', { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (data.totalRevenue !== undefined) {
          setStats({
            totalRevenue: data.totalRevenue,
            activeShops: data.totalShops,
            totalUsers: data.activeUsers,
            pendingApprovals: data.pendingShops
          });
        }
      })
      .catch(err => console.error('Error fetching stats:', err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tools = [
    { name: 'Manage Tenants', description: 'Manage all tenant organizations and subscriptions', icon: '🏢', href: '/admin/manage-tenants', color: '#3b82f6' },
    { name: 'Manage Shops', description: 'Manage all auto repair shops in the network', icon: '🏪', href: '/admin/manage-shops', color: '#22c55e' },
    { name: 'Financial Reports', description: 'Revenue, payouts, and financial analytics', icon: '💰', href: '/admin/financial-reports', color: '#f59e0b' },
    { name: 'User Management', description: 'Manage all platform users and roles', icon: '👥', href: '/admin/user-management', color: '#a855f7' },
    { name: 'Approved Shops', description: 'View all verified and active shop partners', icon: '✓', href: '/admin/accepted-shops', color: '#22c55e' },
    { name: 'Pending Shops', description: 'Review and approve new shop applications', icon: '⏳', href: '/admin/pending-shops', color: '#e5332a' },
    { name: 'Activity Logs', description: 'Complete system activity history', icon: '📋', href: '/admin/activity-logs', color: '#3b82f6' },
    { name: 'System Settings', description: 'Configure platform settings and preferences', icon: '⚙️', href: '/admin/system-settings', color: '#6b7280' },
    { name: 'Email Templates', description: 'Manage email notifications and templates', icon: '✉️', href: '/admin/email-templates', color: '#8b5cf6' },
    { name: 'Platform Analytics', description: 'Detailed analytics and performance metrics', icon: '📊', href: '/admin/platform-analytics', color: '#f59e0b' },
    { name: 'Security Settings', description: 'Manage security policies and permissions', icon: '🔒', href: '/admin/security-settings', color: '#e5332a' },
    { name: 'Backup & Restore', description: 'Database backup and restore operations', icon: '💾', href: '/admin/backup-restore', color: '#3b82f6' },
  ];

  return (
    <div style={{minHeight:'100vh', background:'linear-gradient(135deg, #3d3d3d 0%, #4a4a4a 50%, #525252 100%)'}}>
      <div style={{background:'rgba(0,0,0,0.3)', borderBottom:'1px solid rgba(229,51,42,0.3)', padding:'20px 32px'}}>
        <div style={{maxWidth:1400, margin:'0 auto'}}>
          <Link href="/admin/home" style={{color:'#3b82f6', textDecoration:'none', fontSize:14, fontWeight:600, marginBottom:16, display:'inline-block'}}>
            ← Back to Dashboard
          </Link>
          <h1 style={{fontSize:28, fontWeight:700, color:'#e5e7eb', marginBottom:8}}>⚙️ All Admin Tools</h1>
          <p style={{fontSize:14, color:'#9aa3b2'}}>Complete admin control center and management tools</p>
        </div>
      </div>

      <div style={{maxWidth:1400, margin:'0 auto', padding:32}}>
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:20}}>
          {tools.map((tool, idx) => (
            <Link key={idx} href={tool.href} style={{textDecoration:'none'}}>
              <div style={{background:'rgba(0,0,0,0.3)', border:`1px solid rgba(${parseInt(tool.color.slice(1,3),16)},${parseInt(tool.color.slice(3,5),16)},${parseInt(tool.color.slice(5,7),16)},0.3)`, borderRadius:12, padding:24, cursor:'pointer', transition:'all 0.3s', height:'100%'}}>
                <div style={{fontSize:40, marginBottom:16}}>{tool.icon}</div>
                <h3 style={{fontSize:18, fontWeight:700, color:'#e5e7eb', marginBottom:8}}>{tool.name}</h3>
                <p style={{fontSize:14, color:'#9aa3b2', lineHeight:1.5}}>{tool.description}</p>
                <div style={{marginTop:16, display:'inline-flex', alignItems:'center', gap:8, color:tool.color, fontSize:14, fontWeight:600}}>
                  Open Tool →
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Stats */}
        <div style={{marginTop:40, background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:24}}>
          <h2 style={{fontSize:20, fontWeight:700, color:'#e5e7eb', marginBottom:20}}>Platform Overview</h2>
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:16}}>
            <div style={{background:'rgba(255,255,255,0.05)', borderRadius:8, padding:16}}>
              <div style={{fontSize:13, color:'#9aa3b2', marginBottom:4}}>Total Revenue</div>
              <div style={{fontSize:24, fontWeight:700, color:'#22c55e'}}>{stats.totalRevenue}</div>
            </div>
            <div style={{background:'rgba(255,255,255,0.05)', borderRadius:8, padding:16}}>
              <div style={{fontSize:13, color:'#9aa3b2', marginBottom:4}}>Active Shops</div>
              <div style={{fontSize:24, fontWeight:700, color:'#3b82f6'}}>{stats.activeShops}</div>
            </div>
            <div style={{background:'rgba(255,255,255,0.05)', borderRadius:8, padding:16}}>
              <div style={{fontSize:13, color:'#9aa3b2', marginBottom:4}}>Total Users</div>
              <div style={{fontSize:24, fontWeight:700, color:'#a855f7'}}>{stats.totalUsers}</div>
            </div>
            <div style={{background:'rgba(255,255,255,0.05)', borderRadius:8, padding:16}}>
              <div style={{fontSize:13, color:'#9aa3b2', marginBottom:4}}>Pending Approvals</div>
              <div style={{fontSize:24, fontWeight:700, color:'#e5332a'}}>{stats.pendingApprovals}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
