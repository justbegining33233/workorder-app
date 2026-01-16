'use client';

import { useEffect, useState, startTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminHome() {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [mounted, setMounted] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [previousPendingCount, setPreviousPendingCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [platformStats, setPlatformStats] = useState({
    totalRevenue: '$0',
    totalShops: 0,
    totalJobs: 0,
    activeUsers: 0,
    pendingShops: 0,
    systemHealth: 100
  });
  const [approvedShops, setApprovedShops] = useState<any[]>([]);
  const [pendingShops, setPendingShops] = useState<{id: string; name: string; location: string; services: string; submitted: string}[]>([]);
  const [recentActivity, setRecentActivity] = useState<{ type: string; action: string; details: string; time: string }[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const role = localStorage.getItem('userRole');
    const name = localStorage.getItem('userName');
    const isSuperAdmin = localStorage.getItem('isSuperAdmin');
    
    if (role !== 'admin' || isSuperAdmin !== 'true') {
      router.push('/auth/login');
      return;
    }
    
    if (name) setUserName(name);
    
    // Fetch platform statistics
    fetch('/api/admin/stats', { cache: 'no-store', credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.totalRevenue !== undefined) {
          setPlatformStats({
            totalRevenue: data.totalRevenue,
            totalShops: data.totalShops,
            totalJobs: data.totalJobs,
            activeUsers: data.activeUsers,
            pendingShops: data.pendingShops,
            systemHealth: data.systemHealth
          });
          if (data.recentActivity) {
            setRecentActivity(data.recentActivity);
          }
        }
      })
      .catch(err => console.error('Error fetching platform stats:', err));
    
    // Fetch pending shops
    fetch('/api/shops/pending', { cache: 'no-store', credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setPendingShops(data.slice(0, 3));
        }
      })
      .catch(err => console.error('Error fetching pending shops:', err));
    
    // Fetch approved shops
    fetch('/api/shops/accepted', { cache: 'no-store', credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setApprovedShops(data.slice(0, 3));
        }
      })
      .catch(err => console.error('Error fetching approved shops:', err));
    
    // Request notification permission
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          setNotificationPermission(permission);
        });
      }
    }
  }, [mounted, router]);

  // Auto-refresh data every 5 seconds
  useEffect(() => {
    if (!mounted) return;

    let refreshTimeout: NodeJS.Timeout;
    
    const refreshData = async () => {
      try {
        // Refresh platform stats
        const statsResponse = await fetch('/api/admin/stats', { 
          cache: 'no-store', 
          credentials: 'include' 
        });
        
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          if (statsData.totalRevenue !== undefined) {
            const newStats = {
              totalRevenue: statsData.totalRevenue,
              totalShops: statsData.totalShops,
              totalJobs: statsData.totalJobs,
              activeUsers: statsData.activeUsers,
              pendingShops: statsData.pendingShops,
              systemHealth: 100
            };
            
            // Use startTransition for smooth updates
            startTransition(() => {
              setPlatformStats(newStats);
              
              // Check for new pending shops and send notification
              if (newStats.pendingShops > previousPendingCount && previousPendingCount > 0) {
                showNewShopNotification(newStats.pendingShops - previousPendingCount);
              }
              setPreviousPendingCount(newStats.pendingShops);
            });
          }
        }

        // Refresh pending shops
        const pendingResponse = await fetch('/api/shops/pending', {
          cache: 'no-store',
          credentials: 'include'
        });
        
        if (pendingResponse.ok) {
          const pendingData = await pendingResponse.json();
          startTransition(() => {
            setPendingShops(pendingData.slice(0, 3));
          });
        }

        // Refresh approved shops
        const approvedResponse = await fetch('/api/shops/accepted', {
          cache: 'no-store',
          credentials: 'include'
        });
        
        if (approvedResponse.ok) {
          const approvedData = await approvedResponse.json();
          startTransition(() => {
            setApprovedShops(approvedData.slice(0, 3));
          });
        }
      } catch (error) {
        console.error('Error refreshing data:', error);
      }
    };

    // Initial refresh to set previous count
    refreshData();

    // Set up interval for auto-refresh with a slight delay to prevent glitches
    const interval = setInterval(() => {
      refreshTimeout = setTimeout(refreshData, 100); // Small delay
    }, 5000);

    return () => {
      clearInterval(interval);
      if (refreshTimeout) clearTimeout(refreshTimeout);
    };
  }, [mounted, previousPendingCount]);

  const showNewShopNotification = (newCount: number) => {
    if (notificationPermission === 'granted') {
      const notification = new Notification('New Shop Registration', {
        body: `${newCount} new shop${newCount > 1 ? 's' : ''} awaiting approval`,
        icon: '/favicon.ico',
        badge: '/favicon.ico'
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Auto-close after 5 seconds
      setTimeout(() => notification.close(), 5000);
    }
  };

  const fetchPendingShops = async () => {
    try {
      const response = await fetch('/api/shops/pending', {
        cache: 'no-store',
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setPendingShops(data.slice(0, 3));
      }
    } catch (error) {
      console.error('Error fetching pending shops:', error);
    }
  };

  const handleApprove = async (shopId: string) => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      alert('ERROR: No authentication token found. Please log out and log back in.');
      console.error('❌ No token in localStorage. All storage:', { ...localStorage });
      return;
    }
    
    console.log('🟡 Token found:', token.substring(0, 20) + '...');
    
    if (!confirm('Are you sure you want to approve this shop?')) return;
    
    try {
      const response = await fetch('/api/shops/pending', {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id: shopId, action: 'approve' }),
      });

      if (response.ok) {
        alert('Shop approved successfully!');
        fetchPendingShops();
        
        // Refresh approved shops list too
        fetch('/api/shops/accepted', { cache: 'no-store', credentials: 'include' })
          .then(res => res.json())
          .then(data => {
            if (Array.isArray(data)) {
              setApprovedShops(data.slice(0, 3));
            }
          })
          .catch(err => console.error('Error fetching approved shops:', err));
      } else {
        const error = await response.text();
        alert(`Failed to approve: ${response.status} - ${error}`);
      }
    } catch (error) {
      console.error('Error approving shop:', error);
      alert('Failed to approve shop');
    }
  };

  const handleDeny = async (shopId: string) => {
    if (!confirm('Are you sure you want to deny this shop application?')) return;
    
    try {
      const response = await fetch('/api/shops/pending', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: shopId, action: 'deny' }),
      });

      if (response.ok) {
        alert('Shop application denied');
        fetchPendingShops();
      }
    } catch (error) {
      console.error('Error denying shop:', error);
      alert('Failed to deny shop');
    }
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  const handleSignOut = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    router.push('/auth/login');
  };

  return (
    <div style={{minHeight:'100vh', background:'linear-gradient(135deg, #3d3d3d 0%, #4a4a4a 50%, #525252 100%)'}}>
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      {/* Header */}
      <div style={{background:'rgba(0,0,0,0.3)', borderBottom:'1px solid rgba(229,51,42,0.3)', padding:'16px 32px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <div style={{display:'flex', alignItems:'center', gap:24}}>
          <Link href="/" style={{fontSize:24, fontWeight:900, color:'#e5332a', textDecoration:'none'}}>FixTray</Link>
          <div>
            <div style={{fontSize:20, fontWeight:700, color:'#e5e7eb'}}>Admin Dashboard</div>
            <div style={{fontSize:12, color:'#9aa3b2'}}>System Control Center</div>
          </div>
        </div>
        <div style={{display:'flex', alignItems:'center', gap:16}}>
          <div style={{display:'flex', alignItems:'center', gap:8}}>
            {isRefreshing && (
              <div style={{display:'flex', alignItems:'center', gap:4}}>
                <div style={{width:12, height:12, border:'2px solid #e5332a', borderTop:'2px solid transparent', borderRadius:'50%', animation:'spin 1s linear infinite'}}></div>
                <span style={{fontSize:12, color:'#9aa3b2'}}>Refreshing...</span>
              </div>
            )}
            <button 
              onClick={() => {
                const refreshData = async () => {
                  setIsRefreshing(true);
                  try {
                    // Refresh all data
                    const [statsRes, pendingRes, approvedRes] = await Promise.all([
                      fetch('/api/admin/stats', { cache: 'no-store', credentials: 'include' }),
                      fetch('/api/shops/pending', { cache: 'no-store', credentials: 'include' }),
                      fetch('/api/shops/accepted', { cache: 'no-store', credentials: 'include' })
                    ]);

                    if (statsRes.ok) {
                      const statsData = await statsRes.json();
                      startTransition(() => {
                        setPlatformStats({
                          totalRevenue: statsData.totalRevenue || '$0',
                          totalShops: statsData.totalShops || 0,
                          totalJobs: statsData.totalJobs || 0,
                          activeUsers: statsData.activeUsers || 0,
                          pendingShops: statsData.pendingShops || 0,
                          systemHealth: 100
                        });
                      });
                    }

                    if (pendingRes.ok) {
                      const pendingData = await pendingRes.json();
                      startTransition(() => {
                        setPendingShops(pendingData.slice(0, 3));
                      });
                    }

                    if (approvedRes.ok) {
                      const approvedData = await approvedRes.json();
                      startTransition(() => {
                        setApprovedShops(approvedData.slice(0, 3));
                      });
                    }
                  } catch (error) {
                    console.error('Manual refresh error:', error);
                  } finally {
                    setIsRefreshing(false);
                  }
                };
                refreshData();
              }}
              style={{padding:'6px 12px', background:'rgba(229,51,42,0.1)', border:'1px solid rgba(229,51,42,0.3)', color:'#e5332a', borderRadius:6, cursor:'pointer', fontSize:12, fontWeight:600, opacity: isRefreshing ? 0.6 : 1}}
              disabled={isRefreshing}
            >
              {isRefreshing ? '⟳' : '🔄'} {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
          <span style={{fontSize:14, color:'#9aa3b2'}}>Welcome, {userName}</span>
          <button onClick={handleSignOut} style={{padding:'8px 16px', background:'#e5332a', color:'white', border:'none', borderRadius:6, cursor:'pointer', fontSize:13, fontWeight:600}}>
            Sign Out
          </button>
        </div>
      </div>

      <div style={{maxWidth:1400, margin:'0 auto', padding:32}}>
        {/* Platform Overview Stats */}
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:16, marginBottom:32}}>
          <div style={{background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.3)', borderRadius:12, padding:20, transition: 'all 0.3s ease'}}>
            <div style={{fontSize:13, color:'#9aa3b2', marginBottom:8}}>Total Revenue</div>
            <div style={{fontSize:32, fontWeight:700, color:'#22c55e', transition: 'color 0.3s ease'}}>{platformStats.totalRevenue}</div>
            <div style={{fontSize:11, color:'#9aa3b2', marginTop:4}}>All time</div>
          </div>
          <div style={{background:'rgba(59,130,246,0.1)', border:'1px solid rgba(59,130,246,0.3)', borderRadius:12, padding:20, transition: 'all 0.3s ease'}}>
            <div style={{fontSize:13, color:'#9aa3b2', marginBottom:8}}>Total Shops</div>
            <div style={{fontSize:32, fontWeight:700, color:'#3b82f6', transition: 'color 0.3s ease'}}>{platformStats.totalShops}</div>
            <div style={{fontSize:11, color:'#9aa3b2', marginTop:4}}>{platformStats.pendingShops} pending approval</div>
          </div>
          <div style={{background:'rgba(168,85,247,0.1)', border:'1px solid rgba(168,85,247,0.3)', borderRadius:12, padding:20, transition: 'all 0.3s ease'}}>
            <div style={{fontSize:13, color:'#9aa3b2', marginBottom:8}}>Total Jobs</div>
            <div style={{fontSize:32, fontWeight:700, color:'#a855f7', transition: 'color 0.3s ease'}}>{platformStats.totalJobs}</div>
            <div style={{fontSize:11, color:'#9aa3b2', marginTop:4}}>All time</div>
          </div>
          <div style={{background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.3)', borderRadius:12, padding:20, transition: 'all 0.3s ease'}}>
            <div style={{fontSize:13, color:'#9aa3b2', marginBottom:8}}>Active Users</div>
            <div style={{fontSize:32, fontWeight:700, color:'#f59e0b', transition: 'color 0.3s ease'}}>{platformStats.activeUsers}</div>
            <div style={{fontSize:11, color:'#9aa3b2', marginTop:4}}>Last 30 days</div>
          </div>
          <div style={{background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.3)', borderRadius:12, padding:20, transition: 'all 0.3s ease'}}>
            <div style={{fontSize:13, color:'#9aa3b2', marginBottom:8}}>System Health</div>
            <div style={{fontSize:32, fontWeight:700, color:'#22c55e', transition: 'color 0.3s ease'}}>{platformStats.systemHealth}%</div>
            <div style={{fontSize:11, color:'#9aa3b2', marginTop:4}}>All systems operational</div>
          </div>
        </div>

        <div style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap:24}}>
          {/* Left Column */}
          <div>
            {/* Approved Auto Shops */}
            <div style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:24, marginBottom:24}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20}}>
                <h2 style={{fontSize:20, fontWeight:700, color:'#e5e7eb'}}>Approved Auto Shops</h2>
                <Link href="/admin/accepted-shops" style={{color:'#e5332a', fontSize:13, fontWeight:600, textDecoration:'none'}}>View All →</Link>
              </div>
              <div style={{display:'flex', flexDirection:'column', gap:12}}>
                {approvedShops.length === 0 ? (
                  <div style={{textAlign:'center', padding:32, color:'#9aa3b2'}}>
                    No approved shops yet
                  </div>
                ) : (
                  approvedShops.map((shop, idx) => (
                    <div key={shop.id || idx} style={{background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.3)', borderRadius:8, padding:16, transition: 'all 0.3s ease'}}>
                      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                        <div style={{flex:1}}>
                          <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:4}}>
                            <span style={{fontSize:15, fontWeight:700, color:'#e5e7eb'}}>{shop.shopName || shop.name}</span>
                            <span style={{padding:'2px 8px', background:'rgba(34,197,94,0.2)', color:'#22c55e', borderRadius:8, fontSize:11, fontWeight:600}}>
                              ✓ Approved
                            </span>
                          </div>
                          <div style={{fontSize:13, color:'#9aa3b2'}}>{shop.email}</div>
                          <div style={{fontSize:13, color:'#9aa3b2'}}>{shop.phone || 'N/A'}</div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Pending Shop Approvals */}
            <div style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:24}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20}}>
                <h2 style={{fontSize:20, fontWeight:700, color:'#e5e7eb'}}>Pending Shop Approvals</h2>
                <span style={{padding:'4px 8px', background:'#e5332a', color:'white', borderRadius:12, fontSize:11, fontWeight:700}}>
                  {pendingShops.length} Pending
                </span>
              </div>
              <div style={{display:'flex', flexDirection:'column', gap:12}}>
                {pendingShops.map((shop) => (
                  <div key={shop.id} style={{background:'rgba(229,51,42,0.1)', border:'1px solid rgba(229,51,42,0.3)', borderRadius:8, padding:16, transition: 'all 0.3s ease'}}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12}}>
                      <div style={{flex:1}}>
                        <div style={{fontSize:15, fontWeight:700, color:'#e5e7eb', marginBottom:4}}>{shop.name}</div>
                        <div style={{fontSize:13, color:'#9aa3b2', marginBottom:4}}>{shop.location}</div>
                        <div style={{fontSize:12, color:'#6b7280'}}>{shop.services} services • Submitted {getTimeAgo(new Date(shop.submitted))}</div>
                      </div>
                    </div>
                    <div style={{display:'flex', gap:8}}>
                      <button 
                        onClick={() => handleApprove(shop.id)}
                        style={{flex:1, padding:'8px', background:'#22c55e', color:'white', border:'none', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer'}}
                      >
                        ✓ Approve
                      </button>
                      <Link href="/admin/pending-shops" style={{flex:1, textDecoration:'none'}}>
                        <button style={{width:'100%', padding:'8px', background:'rgba(255,255,255,0.1)', color:'#e5e7eb', border:'1px solid rgba(255,255,255,0.2)', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer'}}>
                          Review Details
                        </button>
                      </Link>
                      <button 
                        onClick={() => handleDeny(shop.id)}
                        style={{padding:'8px 12px', background:'rgba(229,51,42,0.2)', color:'#e5332a', border:'1px solid rgba(229,51,42,0.3)', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer'}}
                      >
                        ✕ Deny
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/admin/pending-shops">
                <button style={{width:'100%', marginTop:16, padding:'12px', background:'rgba(229,51,42,0.2)', color:'#e5332a', border:'1px solid rgba(229,51,42,0.3)', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer'}}>
                  View All Pending Shops
                </button>
              </Link>
            </div>
          </div>

          {/* Right Column */}
          <div>
            {/* System Status */}
            <div style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:24, marginBottom:24}}>
              <h2 style={{fontSize:20, fontWeight:700, color:'#e5e7eb', marginBottom:20}}>System Status</h2>
              <div style={{display:'flex', flexDirection:'column', gap:16}}>
                <div>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8}}>
                    <span style={{fontSize:13, color:'#9aa3b2'}}>API Server</span>
                    <span style={{padding:'2px 8px', background:'rgba(34,197,94,0.2)', color:'#22c55e', borderRadius:8, fontSize:11, fontWeight:600}}>
                      ● Online
                    </span>
                  </div>
                  <div style={{width:'100%', height:4, background:'rgba(255,255,255,0.1)', borderRadius:2, overflow:'hidden'}}>
                    <div style={{width:'100%', height:'100%', background:'linear-gradient(90deg, #22c55e, #16a34a)'}} />
                  </div>
                </div>
                <div>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8}}>
                    <span style={{fontSize:13, color:'#9aa3b2'}}>Database</span>
                    <span style={{padding:'2px 8px', background:'rgba(34,197,94,0.2)', color:'#22c55e', borderRadius:8, fontSize:11, fontWeight:600}}>
                      ● Online
                    </span>
                  </div>
                  <div style={{width:'100%', height:4, background:'rgba(255,255,255,0.1)', borderRadius:2, overflow:'hidden'}}>
                    <div style={{width:'98%', height:'100%', background:'linear-gradient(90deg, #22c55e, #16a34a)'}} />
                  </div>
                </div>
                <div>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8}}>
                    <span style={{fontSize:13, color:'#9aa3b2'}}>Payment Gateway</span>
                    <span style={{padding:'2px 8px', background:'rgba(34,197,94,0.2)', color:'#22c55e', borderRadius:8, fontSize:11, fontWeight:600}}>
                      ● Online
                    </span>
                  </div>
                  <div style={{width:'100%', height:4, background:'rgba(255,255,255,0.1)', borderRadius:2, overflow:'hidden'}}>
                    <div style={{width:'99%', height:'100%', background:'linear-gradient(90deg, #22c55e, #16a34a)'}} />
                  </div>
                </div>
                <div>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8}}>
                    <span style={{fontSize:13, color:'#9aa3b2'}}>Storage</span>
                    <span style={{fontSize:11, color:'#9aa3b2'}}>68% used</span>
                  </div>
                  <div style={{width:'100%', height:4, background:'rgba(255,255,255,0.1)', borderRadius:2, overflow:'hidden'}}>
                    <div style={{width:'68%', height:'100%', background:'linear-gradient(90deg, #3b82f6, #2563eb)'}} />
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:24, marginBottom:24}}>
              <h2 style={{fontSize:20, fontWeight:700, color:'#e5e7eb', marginBottom:20}}>Recent Activity</h2>
              <div style={{display:'flex', flexDirection:'column', gap:12}}>
                {recentActivity.length === 0 ? (
                  <div style={{textAlign:'center', padding:32, color:'#9aa3b2'}}>
                    No recent activity
                  </div>
                ) : (
                  recentActivity.map((activity, idx) => (
                    <div key={idx} style={{background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:12}}>
                      <div style={{fontSize:13, fontWeight:700, color:'#e5e7eb', marginBottom:4}}>{activity.action}</div>
                      <div style={{fontSize:12, color:'#9aa3b2', marginBottom:4}}>{activity.details}</div>
                      <div style={{fontSize:11, color:'#6b7280'}}>{getTimeAgo(new Date(activity.time))}</div>
                    </div>
                  ))
                )}
              </div>
              <Link href="/admin/activity-logs">
                <button style={{width:'100%', marginTop:16, padding:'10px', background:'rgba(59,130,246,0.2)', color:'#3b82f6', border:'1px solid rgba(59,130,246,0.3)', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer'}}>
                  View All Logs
                </button>
              </Link>
            </div>

            {/* Quick Actions */}
            <div style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:24}}>
              <h2 style={{fontSize:20, fontWeight:700, color:'#e5e7eb', marginBottom:20}}>Quick Actions</h2>
              <div style={{display:'flex', flexDirection:'column', gap:12}}>
                <Link href="/admin/manage-tenants">
                  <button style={{width:'100%', padding:'12px', background:'rgba(59,130,246,0.2)', color:'#3b82f6', border:'1px solid rgba(59,130,246,0.3)', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', textAlign:'left'}}>
                    🏢 Manage Tenants
                  </button>
                </Link>
                <Link href="/admin/manage-shops">
                  <button style={{width:'100%', padding:'12px', background:'rgba(34,197,94,0.2)', color:'#22c55e', border:'1px solid rgba(34,197,94,0.3)', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', textAlign:'left'}}>
                    🏪 Manage Shops
                  </button>
                </Link>
                <Link href="/admin/financial-reports">
                  <button style={{width:'100%', padding:'12px', background:'rgba(245,158,11,0.2)', color:'#f59e0b', border:'1px solid rgba(245,158,11,0.3)', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', textAlign:'left'}}>
                    💰 Financial Reports
                  </button>
                </Link>
                <Link href="/reports">
                  <button style={{width:'100%', padding:'12px', background:'rgba(34,197,94,0.2)', color:'#22c55e', border:'1px solid rgba(34,197,94,0.3)', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', textAlign:'left'}}>
                    📊 Reports & Analytics
                  </button>
                </Link>
                <Link href="/admin/user-management">
                  <button style={{width:'100%', padding:'12px', background:'rgba(168,85,247,0.2)', color:'#a855f7', border:'1px solid rgba(168,85,247,0.3)', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', textAlign:'left'}}>
                    👥 User Management
                  </button>
                </Link>
                <Link href="/admin/admin-tools">
                  <button style={{width:'100%', padding:'12px', background:'rgba(229,51,42,0.2)', color:'#e5332a', border:'1px solid rgba(229,51,42,0.3)', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', textAlign:'left'}}>
                    ⚙️ All Admin Tools
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
