'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import TimeClock from '@/components/TimeClock';
import TopNavBar from '@/components/TopNavBar';
import Sidebar from '@/components/Sidebar';
import Breadcrumbs from '@/components/Breadcrumbs';

export default function TechHome() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState('');
  const [shopId, setShopId] = useState('');
  const [shopName, setShopName] = useState('');
  const [todayJobs, setTodayJobs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('job-creation');
  const [techProfile, setTechProfile] = useState<any>(null);
  const [shopStats] = useState({
    openJobs: 0,
    completedToday: 0,
    partsOrdered: 0,
    revenue: '$0'
  });

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    const name = localStorage.getItem('userName');
    const id = localStorage.getItem('userId');
    const shop = localStorage.getItem('shopId');
    
    if (role !== 'tech') {
      router.push('/auth/login');
      return;
    }
    
    setUserName(name || '');
    setUserId(id || '');
    setShopId(shop || '');
    
    if (shop) {
      fetchShopName(shop);
    }
    
    // Fetch tech profile
    if (id) {
      fetchTechProfile(id);
    }
    
    // Fetch assigned work orders
    fetchTodayJobs(id || '');
    
    // Set up auto-refresh every 30 seconds
    const refreshInterval = setInterval(() => {
      if (id) {
        fetchTechProfile(id);
        fetchTodayJobs(id);
      }
    }, 30000);
    
    return () => clearInterval(refreshInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchShopName = async (shop: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/shop?shopId=${shop}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const { shop: shopData } = await response.json();
        setShopName(shopData.shopName || 'Shop');
      }
    } catch (error) {
      console.error('Error fetching shop name:', error);
    }
  };

  const fetchTechProfile = async (techId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/techs/${techId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const { tech } = await response.json();
        setTechProfile(tech);
      }
    } catch (error) {
      console.error('Error fetching tech profile:', error);
    }
  };

  const fetchTodayJobs = async (techId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/workorders?assignedTo=${techId}&status=in-progress,assigned`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const { workOrders } = await response.json();
        setTodayJobs(workOrders || []);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('userId');
    localStorage.removeItem('shopId');
    localStorage.removeItem('token');
    router.push('/auth/login');
  };

  const jobCreationTools = [
    { title: 'New Roadside Job', description: 'Create emergency roadside assistance work orders', icon: '🚗', link: '/workorders/new' },
    { title: 'New In-Shop Job', description: 'Schedule in-shop service appointments', icon: '🔧', link: '/workorders/inshop' },
  ];

  const jobManagementTools = [
    { title: 'Active Jobs', description: 'View all your currently assigned work orders', icon: '📋', link: '/workorders/list?status=in-progress' },
    { title: 'Job History', description: 'Browse completed work orders and feedback', icon: '📊', link: '/workorders/list?status=closed' },
  ];

  const fieldTools = [
    { title: 'Share Location', description: 'Share your real-time GPS location', icon: '📍', link: '/tech/share-location' },
    { title: 'Messages', description: 'View and respond to messages', icon: '💬', link: '/tech/messages' },
  ];

  const resourceTools = [
    { title: 'Parts Inventory', description: 'Check parts availability and track inventory', icon: '🔩', link: '/tech/inventory' },
    { title: 'Service Manuals', description: 'Access technical documentation and guides', icon: '📖', link: '/tech/manuals' },
  ];

  const technicalTools = [
    { title: 'Diagnostic Tools', description: 'Run vehicle diagnostics and read error codes', icon: '🔍', link: '/tech/diagnostics' },
    { title: 'Photo Upload', description: 'Upload photos and documentation', icon: '📷', link: '/tech/photos' },
    { title: 'Time Tracking', description: 'Clock in/out and track billable hours', icon: '⏱️', link: '/tech/timesheet' },
    { title: 'Customer Portal', description: 'Access customer vehicle history', icon: '👤', link: '/tech/customers' },
  ];

  return (
    <div style={{minHeight:'100vh', background:'linear-gradient(135deg, #3d3d3d 0%, #4a4a4a 50%, #525252 100%)', display:'flex', flexDirection:'column'}}>
      {/* Top Navigation */}
      <TopNavBar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} showMenuButton={true} />
      
      {/* Breadcrumbs */}
      <Breadcrumbs />
      
      {/* Main Layout with Sidebar */}
      <div style={{display:'flex', flex:1}}>
        {/* Sidebar */}
        <Sidebar role="tech" isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        {/* Main Content */}
        <div style={{flex:1, overflowY:'auto'}}>
          <div style={{maxWidth:1400, margin:'0 auto', padding:32}}>
        {/* Shop Stats */}
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:16, marginBottom:32}}>
          <div style={{background:'rgba(59,130,246,0.1)', border:'1px solid rgba(59,130,246,0.3)', borderRadius:12, padding:20}}>
            <div style={{fontSize:13, color:'#9aa3b2', marginBottom:8}}>My Open Jobs</div>
            <div style={{fontSize:32, fontWeight:700, color:'#3b82f6'}}>{todayJobs.length}</div>
          </div>
          <div style={{background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.3)', borderRadius:12, padding:20}}>
            <div style={{fontSize:13, color:'#9aa3b2', marginBottom:8}}>Completed Today</div>
            <div style={{fontSize:32, fontWeight:700, color:'#22c55e'}}>{shopStats.completedToday}</div>
          </div>
          <div style={{background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.3)', borderRadius:12, padding:20}}>
            <div style={{fontSize:13, color:'#9aa3b2', marginBottom:8}}>Parts Ordered</div>
            <div style={{fontSize:32, fontWeight:700, color:'#f59e0b'}}>{shopStats.partsOrdered}</div>
          </div>
          <div style={{background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.3)', borderRadius:12, padding:20}}>
            <div style={{fontSize:13, color:'#9aa3b2', marginBottom:8}}>Today's Revenue</div>
            <div style={{fontSize:32, fontWeight:700, color:'#22c55e'}}>{shopStats.revenue}</div>
          </div>
        </div>

        <div style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap:24}}>
          {/* Left Column - Today's Tasks */}
          <div>
            <div style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:24}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20}}>
                <h2 style={{fontSize:20, fontWeight:700, color:'#e5e7eb'}}>🔧 My Tasks Today</h2>
                <Link href="/workorders/list" style={{fontSize:13, color:'#3b82f6', textDecoration:'none'}}>View All →</Link>
              </div>
              
              {todayJobs.length === 0 ? (
                <div style={{textAlign:'center', padding:48, color:'#9aa3b2'}}>
                  <div style={{fontSize:48, marginBottom:16}}>✅</div>
                  <div style={{fontSize:18, fontWeight:600, marginBottom:8}}>All caught up!</div>
                  <div style={{fontSize:14}}>No work orders assigned yet</div>
                </div>
              ) : (
                <div style={{display:'flex', flexDirection:'column', gap:12}}>
                  {todayJobs.map(job => (
                    <div key={job.id} style={{background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:16}}>
                      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12}}>
                        <div style={{flex:1}}>
                          <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:4}}>
                            <span style={{fontSize:15, fontWeight:700, color:'#e5e7eb'}}>{job.vehicleType || 'Vehicle Service'}</span>
                            <span style={{
                              padding:'2px 8px',
                              borderRadius:8,
                              fontSize:11,
                              fontWeight:700,
                              background: job.status === 'in-progress' ? 'rgba(34,197,94,0.2)' : 'rgba(59,130,246,0.2)',
                              color: job.status === 'in-progress' ? '#22c55e' : '#3b82f6',
                            }}>
                              {job.status.toUpperCase()}
                            </span>
                          </div>
                          <div style={{fontSize:13, color:'#9aa3b2', marginBottom:4}}>
                            {job.issueDescription?.substring(0, 80)}...
                          </div>
                          <div style={{fontSize:12, color:'#6b7280'}}>
                            WO-{job.id.substring(0, 8)} • {new Date(job.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <Link
                          href={`/workorders/${job.id}`}
                          style={{
                            padding:'6px 12px',
                            background:'#3b82f6',
                            color:'white',
                            borderRadius:6,
                            textDecoration:'none',
                            fontSize:12,
                            fontWeight:600,
                          }}
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tab Navigation for Tools */}
            <div style={{marginTop:32}}>
              <div style={{display:'flex', gap:8, borderBottom:'2px solid rgba(255,255,255,0.1)', paddingBottom:2, overflowX:'auto', marginBottom:24}}>
                <button
                  onClick={() => setActiveTab('job-creation')}
                  style={{
                    padding:'12px 20px',
                    background: activeTab === 'job-creation' ? 'rgba(229,51,42,0.2)' : 'transparent',
                    border:'none',
                    borderBottom: activeTab === 'job-creation' ? '3px solid #e5332a' : '3px solid transparent',
                    color: activeTab === 'job-creation' ? '#e5332a' : '#9aa3b2',
                    cursor:'pointer',
                    fontSize:14,
                    fontWeight:700,
                    transition:'all 0.2s',
                    borderRadius:'8px 8px 0 0',
                    whiteSpace:'nowrap'
                  }}
                >
                  🚗 Job Creation
                </button>
                <button
                  onClick={() => setActiveTab('job-management')}
                  style={{
                    padding:'12px 20px',
                    background: activeTab === 'job-management' ? 'rgba(229,51,42,0.2)' : 'transparent',
                    border:'none',
                    borderBottom: activeTab === 'job-management' ? '3px solid #e5332a' : '3px solid transparent',
                    color: activeTab === 'job-management' ? '#e5332a' : '#9aa3b2',
                    cursor:'pointer',
                    fontSize:14,
                    fontWeight:700,
                    transition:'all 0.2s',
                    borderRadius:'8px 8px 0 0',
                    whiteSpace:'nowrap'
                  }}
                >
                  📋 Job Management
                </button>
                <button
                  onClick={() => setActiveTab('field-tools')}
                  style={{
                    padding:'12px 20px',
                    background: activeTab === 'field-tools' ? 'rgba(229,51,42,0.2)' : 'transparent',
                    border:'none',
                    borderBottom: activeTab === 'field-tools' ? '3px solid #e5332a' : '3px solid transparent',
                    color: activeTab === 'field-tools' ? '#e5332a' : '#9aa3b2',
                    cursor:'pointer',
                    fontSize:14,
                    fontWeight:700,
                    transition:'all 0.2s',
                    borderRadius:'8px 8px 0 0',
                    whiteSpace:'nowrap'
                  }}
                >
                  📍 Field Tools
                </button>
                <button
                  onClick={() => setActiveTab('resources')}
                  style={{
                    padding:'12px 20px',
                    background: activeTab === 'resources' ? 'rgba(229,51,42,0.2)' : 'transparent',
                    border:'none',
                    borderBottom: activeTab === 'resources' ? '3px solid #e5332a' : '3px solid transparent',
                    color: activeTab === 'resources' ? '#e5332a' : '#9aa3b2',
                    cursor:'pointer',
                    fontSize:14,
                    fontWeight:700,
                    transition:'all 0.2s',
                    borderRadius:'8px 8px 0 0',
                    whiteSpace:'nowrap'
                  }}
                >
                  📦 Resources
                </button>
                <button
                  onClick={() => setActiveTab('technical')}
                  style={{
                    padding:'12px 20px',
                    background: activeTab === 'technical' ? 'rgba(229,51,42,0.2)' : 'transparent',
                    border:'none',
                    borderBottom: activeTab === 'technical' ? '3px solid #e5332a' : '3px solid transparent',
                    color: activeTab === 'technical' ? '#e5332a' : '#9aa3b2',
                    cursor:'pointer',
                    fontSize:14,
                    fontWeight:700,
                    transition:'all 0.2s',
                    borderRadius:'8px 8px 0 0',
                    whiteSpace:'nowrap'
                  }}
                >
                  🔧 Technical Tools
                </button>
              </div>

              {/* Tool Cards - Job Creation */}
              {activeTab === 'job-creation' && (
                <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:20}}>
                  {jobCreationTools.map(tool => (
                    <Link key={tool.title} href={tool.link} style={{textDecoration:'none'}}>
                      <div style={{
                        background:'linear-gradient(145deg, rgba(42,42,42,0.9) 0%, rgba(32,32,32,0.9) 100%)',
                        border:'1px solid rgba(255,255,255,0.15)',
                        borderRadius:16,
                        padding:24,
                        cursor:'pointer',
                        transition:'all 0.3s',
                        minHeight:180
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-8px)';
                        e.currentTarget.style.borderColor = 'rgba(229,51,42,0.4)';
                        e.currentTarget.style.boxShadow = '0 12px 24px rgba(229,51,42,0.25)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}>
                        <div style={{fontSize:48, marginBottom:12}}>{tool.icon}</div>
                        <div style={{fontSize:18, fontWeight:700, color:'#e5e7eb', marginBottom:8}}>{tool.title}</div>
                        <div style={{fontSize:13, color:'#9aa3b2'}}>{tool.description}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* Tool Cards - Job Management */}
              {activeTab === 'job-management' && (
                <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:20}}>
                  {jobManagementTools.map(tool => (
                    <Link key={tool.title} href={tool.link} style={{textDecoration:'none'}}>
                      <div style={{
                        background:'linear-gradient(145deg, rgba(42,42,42,0.9) 0%, rgba(32,32,32,0.9) 100%)',
                        border:'1px solid rgba(255,255,255,0.15)',
                        borderRadius:16,
                        padding:24,
                        cursor:'pointer',
                        transition:'all 0.3s',
                        minHeight:180
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-8px)';
                        e.currentTarget.style.borderColor = 'rgba(229,51,42,0.4)';
                        e.currentTarget.style.boxShadow = '0 12px 24px rgba(229,51,42,0.25)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}>
                        <div style={{fontSize:48, marginBottom:12}}>{tool.icon}</div>
                        <div style={{fontSize:18, fontWeight:700, color:'#e5e7eb', marginBottom:8}}>{tool.title}</div>
                        <div style={{fontSize:13, color:'#9aa3b2'}}>{tool.description}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* Tool Cards - Field Tools */}
              {activeTab === 'field-tools' && (
                <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:20}}>
                  {fieldTools.map(tool => (
                    <Link key={tool.title} href={tool.link} style={{textDecoration:'none'}}>
                      <div style={{
                        background:'linear-gradient(145deg, rgba(42,42,42,0.9) 0%, rgba(32,32,32,0.9) 100%)',
                        border:'1px solid rgba(255,255,255,0.15)',
                        borderRadius:16,
                        padding:24,
                        cursor:'pointer',
                        transition:'all 0.3s',
                        minHeight:180
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-8px)';
                        e.currentTarget.style.borderColor = 'rgba(229,51,42,0.4)';
                        e.currentTarget.style.boxShadow = '0 12px 24px rgba(229,51,42,0.25)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}>
                        <div style={{fontSize:48, marginBottom:12}}>{tool.icon}</div>
                        <div style={{fontSize:18, fontWeight:700, color:'#e5e7eb', marginBottom:8}}>{tool.title}</div>
                        <div style={{fontSize:13, color:'#9aa3b2'}}>{tool.description}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* Tool Cards - Resources */}
              {activeTab === 'resources' && (
                <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:20}}>
                  {resourceTools.map(tool => (
                    <Link key={tool.title} href={tool.link} style={{textDecoration:'none'}}>
                      <div style={{
                        background:'linear-gradient(145deg, rgba(42,42,42,0.9) 0%, rgba(32,32,32,0.9) 100%)',
                        border:'1px solid rgba(255,255,255,0.15)',
                        borderRadius:16,
                        padding:24,
                        cursor:'pointer',
                        transition:'all 0.3s',
                        minHeight:180
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-8px)';
                        e.currentTarget.style.borderColor = 'rgba(229,51,42,0.4)';
                        e.currentTarget.style.boxShadow = '0 12px 24px rgba(229,51,42,0.25)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}>
                        <div style={{fontSize:48, marginBottom:12}}>{tool.icon}</div>
                        <div style={{fontSize:18, fontWeight:700, color:'#e5e7eb', marginBottom:8}}>{tool.title}</div>
                        <div style={{fontSize:13, color:'#9aa3b2'}}>{tool.description}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* Tool Cards - Technical Tools */}
              {activeTab === 'technical' && (
                <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:20}}>
                  {technicalTools.map(tool => (
                    <Link key={tool.title} href={tool.link} style={{textDecoration:'none'}}>
                      <div style={{
                        background:'linear-gradient(145deg, rgba(42,42,42,0.9) 0%, rgba(32,32,32,0.9) 100%)',
                        border:'1px solid rgba(255,255,255,0.15)',
                        borderRadius:16,
                        padding:24,
                        cursor:'pointer',
                        transition:'all 0.3s',
                        minHeight:180
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-8px)';
                        e.currentTarget.style.borderColor = 'rgba(229,51,42,0.4)';
                        e.currentTarget.style.boxShadow = '0 12px 24px rgba(229,51,42,0.25)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}>
                        <div style={{fontSize:48, marginBottom:12}}>{tool.icon}</div>
                        <div style={{fontSize:18, fontWeight:700, color:'#e5e7eb', marginBottom:8}}>{tool.title}</div>
                        <div style={{fontSize:13, color:'#9aa3b2'}}>{tool.description}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div>
            {/* Tech Profile Card */}
            {techProfile && (
              <div style={{background:'rgba(59,130,246,0.1)', border:'1px solid rgba(59,130,246,0.3)', borderRadius:12, padding:20, marginBottom:24}}>
                <div style={{display:'flex', alignItems:'center', gap:12, marginBottom:16}}>
                  <div style={{fontSize:32}}>👤</div>
                  <div>
                    <div style={{fontSize:16, fontWeight:700, color:'#e5e7eb'}}>{techProfile.firstName} {techProfile.lastName}</div>
                    <div style={{fontSize:12, color:'#9aa3b2'}}>{techProfile.role === 'tech' ? 'Technician' : 'Manager'}</div>
                  </div>
                </div>
                <div style={{borderTop:'1px solid rgba(255,255,255,0.1)', paddingTop:12}}>
                  <div style={{display:'grid', gap:8}}>
                    <div style={{display:'flex', justifyContent:'space-between'}}>
                      <span style={{fontSize:13, color:'#9aa3b2'}}>Email:</span>
                      <span style={{fontSize:13, color:'#e5e7eb'}}>{techProfile.email}</span>
                    </div>
                    <div style={{display:'flex', justifyContent:'space-between'}}>
                      <span style={{fontSize:13, color:'#9aa3b2'}}>Phone:</span>
                      <span style={{fontSize:13, color:'#e5e7eb'}}>{techProfile.phone || 'N/A'}</span>
                    </div>
                    <div style={{display:'flex', justifyContent:'space-between', background:'rgba(34,197,94,0.2)', padding:'8px 12px', borderRadius:8, marginTop:4}}>
                      <span style={{fontSize:13, fontWeight:600, color:'#22c55e'}}>Hourly Rate:</span>
                      <span style={{fontSize:16, fontWeight:700, color:'#22c55e'}}>${techProfile.hourlyRate.toFixed(2)}/hr</span>
                    </div>
                    <div style={{display:'flex', justifyContent:'space-between'}}>
                      <span style={{fontSize:13, color:'#9aa3b2'}}>Status:</span>
                      <span style={{fontSize:13, fontWeight:600, color: techProfile.available ? '#22c55e' : '#ef4444'}}>
                        {techProfile.available ? '● Active' : '○ Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
                <div style={{marginTop:12, fontSize:11, color:'#6b7280', textAlign:'center'}}>
                  ⟳ Auto-refreshes every 30 seconds
                </div>
              </div>
            )}

            {/* Time Clock */}
            <TimeClock techId={userId} shopId={shopId} techName={userName} />

            {/* Quick Tools */}
            <div style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:24, marginTop:24}}>
              <h3 style={{color:'#e5e7eb', marginBottom:16, fontSize:16}}>🛠️ Quick Tools</h3>
              <div style={{display:'grid', gap:8}}>
                <Link href="/tech/diagnostics" style={{padding:12, background:'rgba(59,130,246,0.1)', borderRadius:8, textDecoration:'none', color:'#3b82f6', fontSize:14, fontWeight:600}}>
                  🔍 Diagnostics
                </Link>
                <Link href="/tech/inventory" style={{padding:12, background:'rgba(34,197,94,0.1)', borderRadius:8, textDecoration:'none', color:'#22c55e', fontSize:14, fontWeight:600}}>
                  📦 Inventory
                </Link>
                <Link href="/tech/manuals" style={{padding:12, background:'rgba(168,85,247,0.1)', borderRadius:8, textDecoration:'none', color:'#a855f7', fontSize:14, fontWeight:600}}>
                  📖 Manuals
                </Link>
                <Link href="/tech/photos" style={{padding:12, background:'rgba(245,158,11,0.1)', borderRadius:8, textDecoration:'none', color:'#f59e0b', fontSize:14, fontWeight:600}}>
                  📸 Photos
                </Link>
                <Link href="/tech/all-tools" style={{padding:12, background:'rgba(229,51,42,0.1)', borderRadius:8, textDecoration:'none', color:'#e5332a', fontSize:14, fontWeight:600}}>
                  🛠️ All Tools
                </Link>
              </div>
            </div>

            {/* View Center Control */}
            <div style={{background:'rgba(229,51,42,0.1)', border:'1px solid rgba(229,51,42,0.3)', borderRadius:12, padding:20, marginTop:24, textAlign:'center'}}>
              <div style={{fontSize:14, color:'#e5332a', fontWeight:600, marginBottom:8}}>📊 Shop Overview</div>
              <Link
                href="/shop/home"
                style={{
                  display:'block',
                  padding:10,
                  background:'#e5332a',
                  color:'white',
                  borderRadius:6,
                  textDecoration:'none',
                  fontSize:13,
                  fontWeight:600,
                }}
              >
                View Center Control
              </Link>
            </div>
          </div>
        </div>
          </div>
        </div>
      </div>
    </div>
  );
}
