'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type ActivityLog = {
  id: string;
  type: 'shop' | 'revenue' | 'user' | 'alert';
  action: string;
  details: string;
  time: Date;
  severity: 'info' | 'success' | 'warning' | 'error';
  user: string;
  location?: string;
  email?: string;
  amount?: string;
  reason?: string;
};

export default function ActivityLogs() {
  const router = useRouter();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    const isSuperAdmin = localStorage.getItem('isSuperAdmin');
    if (role !== 'admin' || isSuperAdmin !== 'true') {
      router.push('/auth/login');
      return;
    }
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType, filterSeverity]);

  const fetchLogs = async () => {
    try {
      const params = new URLSearchParams();
      if (filterType !== 'all') params.append('type', filterType);
      if (filterSeverity !== 'all') params.append('severity', filterSeverity);

      const response = await fetch(`/api/activity-logs?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      }
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const logDate = new Date(date);
    const diff = now.getTime() - logDate.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'shop': return '🏪';
      case 'revenue': return '💰';
      case 'user': return '👤';
      case 'alert': return '⚠️';
      default: return '📋';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'shop': return '#3b82f6';
      case 'revenue': return '#22c55e';
      case 'user': return '#8b5cf6';
      case 'alert': return '#f59e0b';
      default: return '#9aa3b2';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'success': return '#22c55e';
      case 'info': return '#3b82f6';
      case 'warning': return '#f59e0b';
      case 'error': return '#e5332a';
      default: return '#9aa3b2';
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'success': return '✓';
      case 'info': return 'ℹ';
      case 'warning': return '⚠';
      case 'error': return '✕';
      default: return '•';
    }
  };

  return (
    <div style={{minHeight:'100vh', background:'linear-gradient(135deg, #3d3d3d 0%, #4a4a4a 50%, #525252 100%)'}}>
      {/* Header */}
      <div style={{background:'rgba(0,0,0,0.3)', borderBottom:'1px solid rgba(255,255,255,0.1)', padding:'20px 32px'}}>
        <div style={{maxWidth:1400, margin:'0 auto'}}>
          <Link href="/admin/home" style={{color:'#3b82f6', textDecoration:'none', fontSize:14, fontWeight:600, marginBottom:16, display:'inline-block'}}>
            ← Back to Dashboard
          </Link>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <div>
              <h1 style={{fontSize:28, fontWeight:700, color:'#e5e7eb', marginBottom:8}}>Activity Logs</h1>
              <p style={{fontSize:14, color:'#9aa3b2'}}>Complete system activity history</p>
            </div>
            <div style={{padding:'8px 16px', background:'rgba(59,130,246,0.2)', color:'#3b82f6', borderRadius:8, fontSize:14, fontWeight:700}}>
              {logs.length} Total Logs
            </div>
          </div>
        </div>
      </div>

      <div style={{maxWidth:1400, margin:'0 auto', padding:32}}>
        {/* Filter Controls */}
        <div style={{display:'flex', gap:16, marginBottom:24, flexWrap:'wrap'}}>
          <div>
            <label style={{display:'block', fontSize:12, color:'#9aa3b2', marginBottom:8, fontWeight:600}}>Filter by Type</label>
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={{padding:'10px 16px', background:'rgba(0,0,0,0.3)', color:'#e5e7eb', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer', minWidth:150}}
            >
              <option value="all">All Types</option>
              <option value="shop">Shops</option>
              <option value="revenue">Revenue</option>
              <option value="user">Users</option>
              <option value="alert">Alerts</option>
            </select>
          </div>
          <div>
            <label style={{display:'block', fontSize:12, color:'#9aa3b2', marginBottom:8, fontWeight:600}}>Filter by Severity</label>
            <select 
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              style={{padding:'10px 16px', background:'rgba(0,0,0,0.3)', color:'#e5e7eb', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer', minWidth:150}}
            >
              <option value="all">All Severity</option>
              <option value="success">Success</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
            </select>
          </div>
          {(filterType !== 'all' || filterSeverity !== 'all') && (
            <button 
              onClick={() => {
                setFilterType('all');
                setFilterSeverity('all');
              }}
              style={{padding:'10px 20px', background:'rgba(229,51,42,0.2)', color:'#e5332a', border:'1px solid rgba(229,51,42,0.3)', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer', alignSelf:'flex-end'}}
            >
              Clear Filters
            </button>
          )}
        </div>

        {loading ? (
          <div style={{textAlign:'center', padding:80, color:'#9aa3b2', fontSize:16}}>Loading logs...</div>
        ) : logs.length === 0 ? (
          <div style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:80, textAlign:'center'}}>
            <div style={{fontSize:48, marginBottom:16}}>📋</div>
            <div style={{fontSize:20, fontWeight:700, color:'#e5e7eb', marginBottom:8}}>No Activity Logs</div>
            <div style={{fontSize:14, color:'#9aa3b2'}}>No logs match the selected filters</div>
          </div>
        ) : (
          <div style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, overflow:'hidden'}}>
            {/* Timeline */}
            <div style={{display:'flex', flexDirection:'column'}}>
              {logs.map((log, index) => (
                <div key={log.id} style={{display:'flex', gap:20, padding:20, borderBottom:index < logs.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none', position:'relative'}}>
                  {/* Timeline Line */}
                  {index < logs.length - 1 && (
                    <div style={{position:'absolute', left:39, top:60, bottom:-20, width:2, background:'rgba(255,255,255,0.1)'}} />
                  )}
                  
                  {/* Icon */}
                  <div style={{width:40, height:40, borderRadius:'50%', background:`rgba(${getTypeColor(log.type)}15)`, border:`2px solid ${getTypeColor(log.type)}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0, zIndex:1, backgroundColor:'#3d3d3d'}}>
                    {getTypeIcon(log.type)}
                  </div>

                  {/* Content */}
                  <div style={{flex:1}}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8}}>
                      <div style={{flex:1}}>
                        <div style={{display:'flex', alignItems:'center', gap:12, marginBottom:4}}>
                          <h3 style={{fontSize:16, fontWeight:700, color:'#e5e7eb'}}>{log.action}</h3>
                          <span style={{padding:'2px 8px', background:`rgba(${getSeverityColor(log.severity)}20)`, color:getSeverityColor(log.severity), borderRadius:6, fontSize:11, fontWeight:600}}>
                            {getSeverityBadge(log.severity)} {log.severity.toUpperCase()}
                          </span>
                        </div>
                        <div style={{fontSize:14, color:'#9aa3b2', marginBottom:8}}>{log.details}</div>
                        <div style={{display:'flex', gap:16, flexWrap:'wrap'}}>
                          {log.location && (
                            <div style={{fontSize:12, color:'#6b7280'}}>📍 {log.location}</div>
                          )}
                          {log.email && (
                            <div style={{fontSize:12, color:'#6b7280'}}>✉️ {log.email}</div>
                          )}
                          {log.amount && (
                            <div style={{fontSize:12, color:'#22c55e', fontWeight:600}}>💵 {log.amount}</div>
                          )}
                          {log.reason && (
                            <div style={{fontSize:12, color:'#f59e0b'}}>⚠️ {log.reason}</div>
                          )}
                        </div>
                      </div>
                      <div style={{textAlign:'right', marginLeft:16}}>
                        <div style={{fontSize:13, color:'#9aa3b2', marginBottom:4}}>{getTimeAgo(log.time)}</div>
                        <div style={{fontSize:11, color:'#6b7280'}}>{new Date(log.time).toLocaleString()}</div>
                        <div style={{fontSize:11, color:'#6b7280', marginTop:4}}>by {log.user}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary Stats */}
        {!loading && logs.length > 0 && (
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:16, marginTop:24}}>
            <div style={{background:'rgba(59,130,246,0.1)', border:'1px solid rgba(59,130,246,0.3)', borderRadius:12, padding:20}}>
              <div style={{fontSize:13, color:'#9aa3b2', marginBottom:8}}>Shop Activities</div>
              <div style={{fontSize:28, fontWeight:700, color:'#3b82f6'}}>
                {logs.filter(l => l.type === 'shop').length}
              </div>
            </div>
            <div style={{background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.3)', borderRadius:12, padding:20}}>
              <div style={{fontSize:13, color:'#9aa3b2', marginBottom:8}}>Revenue Events</div>
              <div style={{fontSize:28, fontWeight:700, color:'#22c55e'}}>
                {logs.filter(l => l.type === 'revenue').length}
              </div>
            </div>
            <div style={{background:'rgba(139,92,246,0.1)', border:'1px solid rgba(139,92,246,0.3)', borderRadius:12, padding:20}}>
              <div style={{fontSize:13, color:'#9aa3b2', marginBottom:8}}>User Activities</div>
              <div style={{fontSize:28, fontWeight:700, color:'#8b5cf6'}}>
                {logs.filter(l => l.type === 'user').length}
              </div>
            </div>
            <div style={{background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.3)', borderRadius:12, padding:20}}>
              <div style={{fontSize:13, color:'#9aa3b2', marginBottom:8}}>System Alerts</div>
              <div style={{fontSize:28, fontWeight:700, color:'#f59e0b'}}>
                {logs.filter(l => l.type === 'alert').length}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
