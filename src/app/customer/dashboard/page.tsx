'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import NotificationBell from '../../../components/NotificationBell';
import TopNavBar from '../../../components/TopNavBar';
import RealTimeWorkOrders from '../../../components/RealTimeWorkOrders';
import CustomerMessagingCard from '../../../components/CustomerMessagingCard';
import { useRequireAuth } from '../../../contexts/AuthContext';
import '../../../styles/sos-theme.css';

export default function CustomerDashboard() {
  useRequireAuth(['customer']);
  // Placeholder data - will be replaced with real API calls
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState('');
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('discover');
  const [loyaltyPoints, setLoyaltyPoints] = useState(250);
  const [tier, setTier] = useState('Silver');
  
  // Real data states
  const [stats, setStats] = useState({
    appointmentCount: 0,
    upcomingAppointments: 0,
    vehicleCount: 0,
    reviewCount: 0,
    favoriteCount: 0,
    historyCount: 0,
    documentCount: 0,
    unreadMessages: 0,
    paymentMethods: 0,
  });
  
  // Recent data for each feature
  const [recentData, setRecentData] = useState<{
    appointments: any[];
    vehicles: any[];
    messages: any[];
    reviews: any[];
    favorites: any[];
    history: any[];
    documents: any[];
    payments: any[];
  }>({
    appointments: [],
    vehicles: [],
    messages: [],
    reviews: [],
    favorites: [],
    history: [],
    documents: [],
    payments: [],
  });
  
  const [customerStats] = useState({
    openOrders: 0,
    completedToday: 0,
    messages: 0,
    appointments: 0
  });

  useEffect(() => {
    setMounted(true);
    const name = localStorage.getItem('userName');
    const id = localStorage.getItem('userId');
    
    if (name) setUserName(name);
    if (id) setUserId(id);
    fetchStats();
  }, []);

  // Live updates: listen for socket events dispatched by `useSocket`
  useEffect(() => {
    const onWorkOrderUpdated = (e: any) => {
      const data = e?.detail || e;
      // Prepend to recent history and refresh counts
      setRecentData(prev => ({ ...prev, history: [data, ...prev.history].slice(0, 3) }));
      // Refresh counts to keep UI consistent
      fetchStats();
    };

    const onNewMessage = (e: any) => {
      const data = e?.detail || e;
      // Prepend to recent messages and increment unread count
      setRecentData(prev => ({ ...prev, messages: [data, ...prev.messages].slice(0, 3) }));
      setStats(prev => ({ ...prev, unreadMessages: (prev.unreadMessages || 0) + 1 }));
    };

    const onLocationUpdate = (e: any) => {
      // For live tracking card (if viewing an active tracking work order), we might refresh tracking data
      // For now just refresh stats to pick up any tracking-based changes
      fetchStats();
    };

    window.addEventListener('work-order:updated', onWorkOrderUpdated as EventListener);
    window.addEventListener('chat:new-message', onNewMessage as EventListener);
    window.addEventListener('tech:location_updated', onLocationUpdate as EventListener);

    return () => {
      window.removeEventListener('work-order:updated', onWorkOrderUpdated as EventListener);
      window.removeEventListener('chat:new-message', onNewMessage as EventListener);
      window.removeEventListener('tech:location_updated', onLocationUpdate as EventListener);
    };
  }, []);

  const fetchStats = async () => {
    try {
      const fetchOpts = { credentials: 'include' } as RequestInit;

      // Fetch appointments
      const apptRes = await fetch('/api/appointments', fetchOpts);
      const apptData = await apptRes.json();
      const appointments = apptData.appointments || [];
      const upcoming = appointments.filter((a: any) => 
        a.status === 'Scheduled' || a.status === 'Confirmed'
      ).length;
      
      // Fetch vehicles
      const vehicleRes = await fetch('/api/customers/vehicles', fetchOpts);
      const vehicles = await vehicleRes.json();
      
      // Fetch reviews
      const reviewRes = await fetch('/api/reviews', fetchOpts);
      const reviews = await reviewRes.json();
      
      // Fetch favorites
      const favRes = await fetch('/api/customers/favorites', fetchOpts);
      const favorites = await favRes.json();
      
      // Fetch work orders for history
      const historyRes = await fetch('/api/workorders', fetchOpts);
      const workorders = await historyRes.json();
      const completed = Array.isArray(workorders) ? workorders.filter((w: any) => w.status === 'Completed') : [];
      
      // Fetch documents
      const docRes = await fetch('/api/customers/documents', fetchOpts);
      const documents = await docRes.json();
      
      // Fetch messages
      const msgRes = await fetch('/api/customers/messages', fetchOpts);
      const messages = await msgRes.json();
      const unread = Array.isArray(messages) ? messages.filter((m: any) => !m.read && m.from !== 'customer').length : 0;
      
      // Fetch payment methods
      const paymentRes = await fetch('/api/customers/payment-methods', fetchOpts);
      const paymentMethods = await paymentRes.json();

      setStats({
        appointmentCount: appointments.length,
        upcomingAppointments: upcoming,
        vehicleCount: Array.isArray(vehicles) ? vehicles.length : 0,
        reviewCount: Array.isArray(reviews) ? reviews.length : 0,
        favoriteCount: Array.isArray(favorites) ? favorites.length : 0,
        historyCount: completed.length,
        documentCount: Array.isArray(documents) ? documents.length : 0,
        unreadMessages: unread,
        paymentMethods: Array.isArray(paymentMethods) ? paymentMethods.length : 0,
      });
      
      // Store recent data (last 3 items)
      setRecentData(prev => ({
        appointments: appointments.slice(0, 3),
        vehicles: Array.isArray(vehicles) ? vehicles.slice(0, 3) : [],
        messages: Array.isArray(messages) ? messages.slice(0, 3) : prev.messages,
        reviews: Array.isArray(reviews) ? reviews.slice(0, 3) : [],
        favorites: Array.isArray(favorites) ? favorites.slice(0, 3) : [],
        history: completed.slice(0, 3),
        documents: Array.isArray(documents) ? documents.slice(0, 3) : [],
        payments: Array.isArray(paymentMethods) ? paymentMethods.slice(0, 3) : [],
      }));
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    window.location.href = '/auth/login';
  };

  const discoverFeatures = [
    { 
      id: 'findshops', 
      icon: '🔍', 
      name: 'Find Shops', 
      desc: 'Discover service centers near you', 
      detail: 'Search by location and compare ratings', 
      badge: 'Popular', 
      badgeColor: '#3b82f6', 
      link: '/customer/findshops',
      getData: () => []
    },
    { 
      id: 'appointments', 
      icon: '📅', 
      name: 'Appointments', 
      desc: 'Book and manage service appointments', 
      detail: `${stats.upcomingAppointments} upcoming • ${stats.appointmentCount} total`, 
      badge: stats.upcomingAppointments > 0 ? 'Active' : '', 
      badgeColor: '#10b981', 
      link: '/customer/appointments',
      getData: () => recentData.appointments
    },
    { 
      id: 'quotes', 
      icon: '💰', 
      name: 'MY ESTIMATES', 
      desc: 'View and manage your service estimates', 
      detail: 'Get estimates before service', 
      badge: '', 
      badgeColor: '', 
      link: '/customer/estimates',
      getData: () => []
    },
  ];

  const activeFeatures = [
    { 
      id: 'tracking', 
      icon: '📍', 
      name: 'Live Tracking', 
      desc: 'Track your tech in real-time', 
      detail: 'View real-time location updates', 
      badge: 'Live', 
      badgeColor: '#ef4444', 
      link: '/customer/tracking',
      getData: () => []
    },
    { 
      id: 'messages', 
      icon: '💬', 
      name: 'Messages', 
      desc: 'Chat with your technician', 
      detail: stats.unreadMessages > 0 ? `${stats.unreadMessages} unread message${stats.unreadMessages !== 1 ? 's' : ''}` : 'Direct communication channel', 
      badge: stats.unreadMessages > 0 ? 'New' : '', 
      badgeColor: '#ef4444', 
      link: '/customer/messages',
      getData: () => recentData.messages
    },
    { 
      id: 'vehicles', 
      icon: '🚛', 
      name: 'My Vehicles', 
      desc: 'Manage your fleet information', 
      detail: `${stats.vehicleCount} vehicle${stats.vehicleCount !== 1 ? 's' : ''} registered`, 
      badge: 'Essential', 
      badgeColor: '#f59e0b', 
      link: '/customer/vehicles',
      getData: () => recentData.vehicles
    },
  ];

  const accountFeatures = [
    { 
      id: 'reviews', 
      icon: '⭐', 
      name: 'Reviews', 
      desc: 'Share your service experiences', 
      detail: `${stats.reviewCount} review${stats.reviewCount !== 1 ? 's' : ''} written`, 
      badge: '', 
      badgeColor: '', 
      link: '/customer/reviews',
      getData: () => recentData.reviews
    },
    { 
      id: 'favorites', 
      icon: '❤️', 
      name: 'Favorite Shops', 
      desc: 'Quick access to preferred shops', 
      detail: `${stats.favoriteCount} saved favorite${stats.favoriteCount !== 1 ? 's' : ''}`, 
      badge: '', 
      badgeColor: '', 
      link: '/customer/favorites',
      getData: () => recentData.favorites
    },
    { 
      id: 'rewards', 
      icon: '🎁', 
      name: 'Rewards', 
      desc: 'Earn points and unlock perks', 
      detail: `${loyaltyPoints} points • ${tier} tier`, 
      badge: 'New', 
      badgeColor: '#a855f7', 
      link: '/customer/rewards',
      getData: () => []
    },
    { 
      id: 'payments', 
      icon: '💳', 
      name: 'Payments', 
      desc: 'Manage payment methods', 
      detail: `${stats.paymentMethods} saved payment method${stats.paymentMethods !== 1 ? 's' : ''}`, 
      badge: '', 
      badgeColor: '', 
      link: '/customer/payments',
      getData: () => recentData.payments
    },
  ];

  const recordsFeatures = [
    { 
      id: 'history', 
      icon: '📋', 
      name: 'Service History', 
      desc: 'View past service records', 
      detail: `${stats.historyCount} completed service${stats.historyCount !== 1 ? 's' : ''}`, 
      badge: '', 
      badgeColor: '', 
      link: '/customer/history',
      getData: () => recentData.history
    },
    { 
      id: 'documents', 
      icon: '📄', 
      name: 'Documents', 
      desc: 'Access invoices and receipts', 
      detail: `${stats.documentCount} document${stats.documentCount !== 1 ? 's' : ''} available`, 
      badge: '', 
      badgeColor: '', 
      link: '/customer/documents',
      getData: () => recentData.documents
    },
    { 
      id: 'insights', 
      icon: '📈', 
      name: 'Insights', 
      desc: 'Track spending and trends', 
      detail: 'Analytics and reports', 
      badge: 'Pro', 
      badgeColor: '#ec4899', 
      link: '/customer/insights',
      getData: () => []
    },
  ];

  return (
    <div style={{minHeight:'100vh', background:'linear-gradient(135deg, #3d3d3d 0%, #4a4a4a 50%, #525252 100%)'}}>
      {/* Top Navigation */}
      <TopNavBar showMenuButton={false} />
      <div style={{background:'rgba(0,0,0,0.15)', padding:'8px 32px', display:'flex', justifyContent:'flex-end'}}>
        <div style={{fontSize:12, color:'#b8beca'}}>{tier} • {loyaltyPoints} pts</div>
      </div>

      <div style={{maxWidth:1400, margin:'0 auto', padding:32}}>
        {/* Customer Stats */}
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:16, marginBottom:32}}>
          <div style={{background:'rgba(59,130,246,0.1)', border:'1px solid rgba(59,130,246,0.3)', borderRadius:12, padding:20}}>
            <div style={{fontSize:13, color:'#9aa3b2', marginBottom:8}}>Active Jobs</div>
            <div style={{fontSize:32, fontWeight:700, color:'#3b82f6'}}>{customerStats.openOrders}</div>
          </div>
          <div style={{background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.3)', borderRadius:12, padding:20}}>
            <div style={{fontSize:13, color:'#9aa3b2', marginBottom:8}}>Total Vehicles</div>
            <div style={{fontSize:32, fontWeight:700, color:'#22c55e'}}>{stats.vehicleCount}</div>
          </div>
          <div style={{background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.3)', borderRadius:12, padding:20}}>
            <div style={{fontSize:13, color:'#9aa3b2', marginBottom:8}}>Unread Messages</div>
            <div style={{fontSize:32, fontWeight:700, color:'#f59e0b'}}>{stats.unreadMessages}</div>
          </div>
          <div style={{background:'rgba(229,51,42,0.1)', border:'1px solid rgba(229,51,42,0.3)', borderRadius:12, padding:20}}>
            <div style={{fontSize:13, color:'#9aa3b2', marginBottom:8}}>Loyalty Points</div>
            <div style={{fontSize:32, fontWeight:700, color:'#e5332a'}}>{loyaltyPoints}</div>
          </div>
        </div>

        {/* Real-Time Work Orders Updates */}
        <RealTimeWorkOrders userId={userId} onWorkOrderUpdate={(data) => {
          // Mirror what the window listener does so updates from this component bubble up immediately
          setRecentData(prev => ({ ...prev, history: [data, ...prev.history].slice(0, 3) }));
          fetchStats();
        }} />

        {/* Tab Navigation */}
        <div style={{marginBottom:32}}>
          <div style={{display:'flex', gap:8, borderBottom:'2px solid rgba(255,255,255,0.1)', paddingBottom:2, overflowX:'auto'}}>
            <button
              onClick={() => setActiveTab('discover')}
              style={{
                padding:'12px 24px',
                background: activeTab === 'discover' ? 'rgba(229,51,42,0.2)' : 'transparent',
                border:'none',
                borderBottom: activeTab === 'discover' ? '3px solid #e5332a' : '3px solid transparent',
                color: activeTab === 'discover' ? '#e5332a' : '#9aa3b2',
                cursor:'pointer',
                fontSize:15,
                fontWeight:700,
                transition:'all 0.2s',
                borderRadius:'8px 8px 0 0',
                whiteSpace:'nowrap'
              }}
            >
              🔍 Discover
            </button>
            <button
              onClick={() => setActiveTab('active')}
              style={{
                padding:'12px 24px',
                background: activeTab === 'active' ? 'rgba(229,51,42,0.2)' : 'transparent',
                border:'none',
                borderBottom: activeTab === 'active' ? '3px solid #e5332a' : '3px solid transparent',
                color: activeTab === 'active' ? '#e5332a' : '#9aa3b2',
                cursor:'pointer',
                fontSize:15,
                fontWeight:700,
                transition:'all 0.2s',
                borderRadius:'8px 8px 0 0',
                whiteSpace:'nowrap'
              }}
            >
              ⚡ Active Services
            </button>
            <button
              onClick={() => setActiveTab('account')}
              style={{
                padding:'12px 24px',
                background: activeTab === 'account' ? 'rgba(229,51,42,0.2)' : 'transparent',
                border:'none',
                borderBottom: activeTab === 'account' ? '3px solid #e5332a' : '3px solid transparent',
                color: activeTab === 'account' ? '#e5332a' : '#9aa3b2',
                cursor:'pointer',
                fontSize:15,
                fontWeight:700,
                transition:'all 0.2s',
                borderRadius:'8px 8px 0 0',
                whiteSpace:'nowrap'
              }}
            >
              👤 Account
            </button>
            <button
              onClick={() => setActiveTab('records')}
              style={{
                padding:'12px 24px',
                background: activeTab === 'records' ? 'rgba(229,51,42,0.2)' : 'transparent',
                border:'none',
                borderBottom: activeTab === 'records' ? '3px solid #e5332a' : '3px solid transparent',
                color: activeTab === 'records' ? '#e5332a' : '#9aa3b2',
                cursor:'pointer',
                fontSize:15,
                fontWeight:700,
                transition:'all 0.2s',
                borderRadius:'8px 8px 0 0',
                whiteSpace:'nowrap'
              }}
            >
              📊 Records
            </button>
          </div>
        </div>

        {/* Feature Cards Grid - Conditional Rendering Based on Active Tab */}
        {activeTab === 'discover' && (
          <div style={{marginBottom:32}}>
            <h2 style={{fontSize:24, fontWeight:700, color:'#e5e7eb', marginBottom:16}}>🔍 Discover</h2>
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:20}}>
              {discoverFeatures.map(feature => {
                const recentItems = feature.getData();
                return (
              <Link key={feature.id} href={feature.link} style={{textDecoration:'none'}}>
                <div style={{
                  background:'linear-gradient(145deg, rgba(42,42,42,0.9) 0%, rgba(32,32,32,0.9) 100%)',
                  border:'1px solid rgba(255,255,255,0.15)',
                  borderRadius:16,
                  padding:24,
                  cursor:'pointer',
                  transition:'all 0.3s',
                  position:'relative',
                  minHeight:280
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
                  {feature.badge && (
                    <div style={{position:'absolute', top:12, right:12, padding:'4px 10px', background:feature.badgeColor, color:'white', borderRadius:12, fontSize:10, fontWeight:700}}>
                      {feature.badge}
                    </div>
                  )}
                  <div style={{fontSize:48, marginBottom:12}}>{feature.icon}</div>
                  <div style={{fontSize:18, fontWeight:700, color:'#e5e7eb', marginBottom:8}}>{feature.name}</div>
                  <div style={{fontSize:13, color:'#9aa3b2', marginBottom:12}}>{feature.desc}</div>
                  <div style={{fontSize:12, color:'#6b7280', padding:'8px 12px', background:'rgba(0,0,0,0.3)', borderRadius:8, borderLeft:'3px solid rgba(229,51,42,0.5)', marginBottom:12}}>
                    {feature.detail}
                  </div>
                  
                  {/* Recent Items */}
                  {recentItems && recentItems.length > 0 ? (
                    <div style={{marginTop:12, borderTop:'1px solid rgba(255,255,255,0.1)', paddingTop:12}}>
                      <div style={{fontSize:11, fontWeight:600, color:'#9aa3b2', marginBottom:8, textTransform:'uppercase'}}>Recent</div>
                      {recentItems.map((item: any, idx: number) => (
                        <div key={idx} style={{fontSize:11, color:'#b8beca', marginBottom:6, display:'flex', alignItems:'center', gap:6}}>
                          <span style={{color:'#e5332a'}}>•</span>
                          <span style={{flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
                            {item.serviceName || item.make || item.shopName || item.title || 'Item'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{marginTop:12, borderTop:'1px solid rgba(255,255,255,0.1)', paddingTop:12, fontSize:11, color:'#6b7280', textAlign:'center'}}>
                      No recent activity
                    </div>
                  )}
                </div>
              </Link>
            )})}
          </div>
        </div>
        )}

        {activeTab === 'active' && (
        <div style={{marginBottom:32}}>
          <h2 style={{fontSize:24, fontWeight:700, color:'#e5e7eb', marginBottom:16}}>⚡ Active Services</h2>
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:20}}>
            {activeFeatures.map(feature => {
              const recentItems = feature.getData();
              return (
              <Link key={feature.id} href={feature.link} style={{textDecoration:'none'}}>
                <div style={{
                  background:'linear-gradient(145deg, rgba(42,42,42,0.9) 0%, rgba(32,32,32,0.9) 100%)',
                  border:'1px solid rgba(255,255,255,0.15)',
                  borderRadius:16,
                  padding:24,
                  cursor:'pointer',
                  transition:'all 0.3s',
                  position:'relative',
                  minHeight:280
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
                  {feature.badge && (
                    <div style={{position:'absolute', top:12, right:12, padding:'4px 10px', background:feature.badgeColor, color:'white', borderRadius:12, fontSize:10, fontWeight:700}}>
                      {feature.badge}
                    </div>
                  )}
                  <div style={{fontSize:48, marginBottom:12}}>{feature.icon}</div>
                  <div style={{fontSize:18, fontWeight:700, color:'#e5e7eb', marginBottom:8}}>{feature.name}</div>
                  <div style={{fontSize:13, color:'#9aa3b2', marginBottom:12}}>{feature.desc}</div>
                  <div style={{fontSize:12, color:'#6b7280', padding:'8px 12px', background:'rgba(0,0,0,0.3)', borderRadius:8, borderLeft:'3px solid rgba(229,51,42,0.5)', marginBottom:12}}>
                    {feature.detail}
                  </div>
                  
                  {recentItems && recentItems.length > 0 ? (
                    <div style={{marginTop:12, borderTop:'1px solid rgba(255,255,255,0.1)', paddingTop:12}}>
                      <div style={{fontSize:11, fontWeight:600, color:'#9aa3b2', marginBottom:8, textTransform:'uppercase'}}>Recent</div>
                      {recentItems.map((item: any, idx: number) => (
                        <div key={idx} style={{fontSize:11, color:'#b8beca', marginBottom:6, display:'flex', alignItems:'center', gap:6}}>
                          <span style={{color:'#e5332a'}}>•</span>
                          <span style={{flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
                            {item.message || item.subject || item.make || item.content || 'Item'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{marginTop:12, borderTop:'1px solid rgba(255,255,255,0.1)', paddingTop:12, fontSize:11, color:'#6b7280', textAlign:'center'}}>
                      No recent activity
                    </div>
                  )}
                </div>
              </Link>
            )})}
          </div>
        </div>
        )}

        {activeTab === 'account' && (
        <div style={{marginBottom:32}}>
          <h2 style={{fontSize:24, fontWeight:700, color:'#e5e7eb', marginBottom:16}}>👤 Account</h2>
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:20}}>
            {accountFeatures.map(feature => {
              const recentItems = feature.getData();
              return (
              <Link key={feature.id} href={feature.link} style={{textDecoration:'none'}}>
                <div style={{
                  background:'linear-gradient(145deg, rgba(42,42,42,0.9) 0%, rgba(32,32,32,0.9) 100%)',
                  border:'1px solid rgba(255,255,255,0.15)',
                  borderRadius:16,
                  padding:24,
                  cursor:'pointer',
                  transition:'all 0.3s',
                  position:'relative',
                  minHeight:280
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
                  {feature.badge && (
                    <div style={{position:'absolute', top:12, right:12, padding:'4px 10px', background:feature.badgeColor, color:'white', borderRadius:12, fontSize:10, fontWeight:700}}>
                      {feature.badge}
                    </div>
                  )}
                  <div style={{fontSize:48, marginBottom:12}}>{feature.icon}</div>
                  <div style={{fontSize:18, fontWeight:700, color:'#e5e7eb', marginBottom:8}}>{feature.name}</div>
                  <div style={{fontSize:13, color:'#9aa3b2', marginBottom:12}}>{feature.desc}</div>
                  <div style={{fontSize:12, color:'#6b7280', padding:'8px 12px', background:'rgba(0,0,0,0.3)', borderRadius:8, borderLeft:'3px solid rgba(229,51,42,0.5)', marginBottom:12}}>
                    {feature.detail}
                  </div>
                  
                  {recentItems && recentItems.length > 0 ? (
                    <div style={{marginTop:12, borderTop:'1px solid rgba(255,255,255,0.1)', paddingTop:12}}>
                      <div style={{fontSize:11, fontWeight:600, color:'#9aa3b2', marginBottom:8, textTransform:'uppercase'}}>Recent</div>
                      {recentItems.map((item: any, idx: number) => (
                        <div key={idx} style={{fontSize:11, color:'#b8beca', marginBottom:6, display:'flex', alignItems:'center', gap:6}}>
                          <span style={{color:'#e5332a'}}>•</span>
                          <span style={{flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
                            {item.shopName || item.rating || item.last4 || item.comment || 'Item'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{marginTop:12, borderTop:'1px solid rgba(255,255,255,0.1)', paddingTop:12, fontSize:11, color:'#6b7280', textAlign:'center'}}>
                      No recent activity
                    </div>
                  )}
                </div>
              </Link>
            )})}
          </div>
        </div>
        )}

        {activeTab === 'records' && (
        <div>
          <h2 style={{fontSize:24, fontWeight:700, color:'#e5e7eb', marginBottom:16}}>📊 Records</h2>
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:20}}>
            {recordsFeatures.map(feature => {
              const recentItems = feature.getData();
              return (
              <Link key={feature.id} href={feature.link} style={{textDecoration:'none'}}>
                <div style={{
                  background:'linear-gradient(145deg, rgba(42,42,42,0.9) 0%, rgba(32,32,32,0.9) 100%)',
                  border:'1px solid rgba(255,255,255,0.15)',
                  borderRadius:16,
                  padding:24,
                  cursor:'pointer',
                  transition:'all 0.3s',
                  position:'relative',
                  minHeight:280
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
                  {feature.badge && (
                    <div style={{position:'absolute', top:12, right:12, padding:'4px 10px', background:feature.badgeColor, color:'white', borderRadius:12, fontSize:10, fontWeight:700}}>
                      {feature.badge}
                    </div>
                  )}
                  <div style={{fontSize:48, marginBottom:12}}>{feature.icon}</div>
                  <div style={{fontSize:18, fontWeight:700, color:'#e5e7eb', marginBottom:8}}>{feature.name}</div>
                  <div style={{fontSize:13, color:'#9aa3b2', marginBottom:12}}>{feature.desc}</div>
                  <div style={{fontSize:12, color:'#6b7280', padding:'8px 12px', background:'rgba(0,0,0,0.3)', borderRadius:8, borderLeft:'3px solid rgba(229,51,42,0.5)', marginBottom:12}}>
                    {feature.detail}
                  </div>
                  
                  {recentItems && recentItems.length > 0 ? (
                    <div style={{marginTop:12, borderTop:'1px solid rgba(255,255,255,0.1)', paddingTop:12}}>
                      <div style={{fontSize:11, fontWeight:600, color:'#9aa3b2', marginBottom:8, textTransform:'uppercase'}}>Recent</div>
                      {recentItems.map((item: any, idx: number) => (
                        <div key={idx} style={{fontSize:11, color:'#b8beca', marginBottom:6, display:'flex', alignItems:'center', gap:6}}>
                          <span style={{color:'#e5332a'}}>•</span>
                          <span style={{flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
                            {item.title || item.fileName || item.serviceName || 'Item'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{marginTop:12, borderTop:'1px solid rgba(255,255,255,0.1)', paddingTop:12, fontSize:11, color:'#6b7280', textAlign:'center'}}>
                      No recent activity
                    </div>
                  )}
                </div>
              </Link>
            )})}
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
