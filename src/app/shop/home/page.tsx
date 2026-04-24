'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Route } from 'next';
import { FaBolt, FaBox, FaBoxes, FaBuilding, FaBullhorn, FaCalendarAlt, FaChartBar, FaCircle, FaClipboardList, FaCodeBranch, FaCog, FaComments, FaCreditCard, FaDesktop, FaEdit, FaGift, FaHeartbeat, FaIndustry, FaListAlt, FaLock, FaMapMarkerAlt, FaPaintBrush, FaPlug, FaReceipt, FaRoad, FaScroll, FaShoppingCart, FaStar, FaStore, FaSyncAlt, FaTools, FaTruck, FaUser, FaUserTie, FaWrench } from 'react-icons/fa';
import TopNavBar from '@/components/TopNavBar';
import Sidebar from '@/components/Sidebar';
import Breadcrumbs from '@/components/Breadcrumbs';
import MessagingCard from '@/components/MessagingCard';
import RealTimeWorkOrders from '@/components/RealTimeWorkOrders';
import ShopBaysCard from '@/components/ShopBaysCard';
import MobileLayout from '@/components/MobileLayout';
import { useRequireAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/useIsMobile';
import { isPathAllowedForPlan } from '@/lib/subscription-access';
import type { SubscriptionPlan } from '@/lib/subscription';

interface Job {
  id: string;
  service: string;
  priority: string;
  customer: string;
  vehicle: string;
  time: string;
  tech: string;
  status: string;
}

interface TeamMember {
  name: string;
  role: string;
  avatar: React.ReactNode;
  status: string;
  jobs: number;
}

type QuickAction = {
  label: React.ReactNode;
  href: string;
  tint: string;
  color: string;
  border: string;
  requiresAdmin?: boolean;
  hideForAdmin?: boolean;
  requiresManagerOrAdmin?: boolean;
};

export default function ShopHome() {
  const router = useRouter();
  const { user, isLoading } = useRequireAuth(['shop']);
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMember, setNewMember] = useState({
    name: '',
    role: 'tech' as 'tech' | 'manager',
    email: '',
    phone: '',
    password: ''
  });
  const [_todayJobs, _setTodayJobs] = useState<Job[]>([]);
  const [shopStats, setShopStats] = useState({
    openJobs: 0,
    completedToday: 0,
    todayRevenue: '$0',
    weekRevenue: '$0',
    activeTechs: 0,
    pendingApprovals: 0
  });
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [addMemberError, setAddMemberError] = useState('');
  const [addMemberSaving, setAddMemberSaving] = useState(false);
  const [selectedDestinations, setSelectedDestinations] = useState<Record<string, string>>({});
  const [pendingWorkOrders, setPendingWorkOrders] = useState<Job[]>([]);
  const [bays, setBays] = useState<Array<{ id: string; name: string; tech: string; jobs: Job[] }>>([]);
  const [_roadcallJobs, setRoadcallJobs] = useState<Job[]>([]);
  const [subscriptionPlan, setSubscriptionPlan] = useState<SubscriptionPlan | null>(null);
  const userId = (user as any)?.id ?? '';
  const shopId = (user as any)?.shopId ?? user?.id ?? '';

  // Fetch live dashboard data whenever the authenticated user is ready
  useEffect(() => {
    if (!user) return;
    const id = (user as any).shopId ?? user.id;
    if (!id) return;

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

    const fetchDashboard = async () => {
      try {
        const [statsRes, finRes, woRes, teamRes, shopRes] = await Promise.all([
          fetch(`/api/shop/workorder-stats?shopId=${id}`, { headers }),
          fetch(`/api/shop/financial-summary?shopId=${id}`, { headers }),
          fetch(`/api/workorders?shopId=${id}&status=pending`, { headers }),
          fetch(`/api/shop/team?shopId=${id}`, { headers }),
          fetch(`/api/shop/stats?shopId=${id}`, { headers }),
        ]);

        // Work order stats (open jobs, completed today, pending approvals)
        if (statsRes.ok) {
          const data = await statsRes.json();
          const s = data.stats || {};
          setShopStats(prev => ({
            ...prev,
            openJobs: (s.activeJobs || 0) + (s.pendingAssignments || 0),
            completedToday: s.completedToday || 0,
            pendingApprovals: s.pendingAssignments || 0,
          }));
        }

        // Financial summary (today + week revenue)
        if (finRes.ok) {
          const data = await finRes.json();
          const fmt = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
          setShopStats(prev => ({
            ...prev,
            todayRevenue: fmt(data.todayRevenue || 0),
            weekRevenue: fmt(data.weeklyRevenue || 0),
          }));
        }

        // Pending work orders queue
        if (woRes.ok) {
          const data = await woRes.json();
          const orders: Job[] = (data.workOrders || []).map((wo: any) => ({
            id: wo.id,
            service: wo.issueDescription || wo.repairs || 'Service',
            priority: wo.priority || 'Medium',
            customer: wo.customer
              ? `${wo.customer.firstName} ${wo.customer.lastName?.charAt(0) ?? ''}.`
              : 'Walk-in',
            vehicle: wo.vehicleType || '',
            time: new Date(wo.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            tech: wo.assignedTo
              ? `${wo.assignedTo.firstName} ${wo.assignedTo.lastName?.charAt(0) ?? ''}.`
              : 'Unassigned',
            status: 'Pending',
          }));
          setPendingWorkOrders(orders);
        }

        // Team members + active tech count
        if (teamRes.ok) {
          const data = await teamRes.json();
          const members: any[] = data.teamMembers || [];
          setShopStats(prev => ({ ...prev, activeTechs: members.filter((m) => m.available).length }));
          setTeamMembers(members.map((m: any) => ({
            name: `${m.firstName} ${m.lastName}`,
            role: m.role,
            avatar: <FaUser />,
            status: m.available ? 'Active' : 'Offline',
            jobs: 0,
          })));
        }

        // Bays � derive from shop's capacity
        if (shopRes.ok) {
          const data = await shopRes.json();
          const cap: number = data.capacity || data.shop?.capacity || 3;
          setBays(Array.from({ length: cap }, (_, i) => ({
            id: `bay-${i + 1}`,
            name: `Bay ${i + 1}`,
            tech: '',
            jobs: [],
          })));
        }
      } catch {
        // Dashboard will show zeros/empty � not a crash
      }
    };

    fetchDashboard();
  }, [user]);

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const response = await fetch('/api/auth/subscription-gate', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          credentials: 'include',
        });

        if (!response.ok) return;
        const data = await response.json();
        if (data?.plan) setSubscriptionPlan(data.plan as SubscriptionPlan);
      } catch {
        // Keep existing quick actions if plan check fails.
      }
    };

    void fetchPlan();
  }, []);
  const quickActions: QuickAction[] = [
    { label: <><FaBox style={{marginRight:6}}/>Parts</>, href: '/shop/parts-labor', tint: 'rgba(59,130,246,0.18)', color: '#3b82f6', border: 'rgba(59,130,246,0.28)' },
    {
      label:
        user?.role === 'manager'
          ? <><FaChartBar style={{marginRight:6}}/>Manager Panel</>
          : user?.role === 'tech'
          ? <><FaWrench style={{marginRight:6}}/>Tech Panel</>
          : <><FaCog style={{marginRight:6}}/>Shop Admin Panel</>,
      href:
        user?.role === 'manager'
          ? '/shop/manager'
          : user?.role === 'tech'
          ? '/shop/tech'
          : '/shop/admin',
      tint:
        user?.role === 'manager'
          ? 'rgba(59,130,246,0.18)'
          : user?.role === 'tech'
          ? 'rgba(34,197,94,0.18)'
          : 'rgba(229,51,42,0.2)',
      color:
        user?.role === 'manager'
          ? '#3b82f6'
          : user?.role === 'tech'
          ? '#22c55e'
          : '#e5332a',
      border:
        user?.role === 'manager'
          ? 'rgba(59,130,246,0.28)'
          : user?.role === 'tech'
          ? 'rgba(34,197,94,0.28)'
          : 'rgba(229,51,42,0.3)',
      requiresAdmin: user?.role === 'admin',
      requiresManagerOrAdmin: user?.role === 'manager',
      hideForAdmin: user?.role === 'tech',
    },
    { label: <><FaBox style={{marginRight:6}}/>Parts Orders</>, href: '/shop/purchase-orders', tint: 'rgba(139,92,246,0.18)', color: '#8b5cf6', border: 'rgba(139,92,246,0.28)' },
    { label: <><FaTools style={{marginRight:6}}/>Services</>, href: '/shop/services', tint: 'rgba(245,158,11,0.18)', color: '#f59e0b', border: 'rgba(245,158,11,0.28)' },
    { label: <><FaStore style={{marginRight:6}}/>New In-Shop Job</>, href: '/shop/new-inshop-job', tint: 'rgba(229,51,42,0.18)', color: '#e5332a', border: 'rgba(229,51,42,0.28)' },
    { label: <><FaClipboardList style={{marginRight:6}}/>WO Templates</>, href: '/shop/templates', tint: 'rgba(251,191,36,0.18)', color: '#fbbf24', border: 'rgba(251,191,36,0.28)' },
    { label: <><FaIndustry style={{marginRight:6}}/>Vendors</>, href: '/shop/vendors', tint: 'rgba(139,92,246,0.18)', color: '#8b5cf6', border: 'rgba(139,92,246,0.28)' },
    { label: <><FaMapMarkerAlt style={{marginRight:6}}/>Locations</>, href: '/shop/locations', tint: 'rgba(20,184,166,0.18)', color: '#14b8a6', border: 'rgba(20,184,166,0.28)' },
    { label: <><FaSyncAlt style={{marginRight:6}}/>Recurring Orders</>, href: '/shop/recurring-workorders', tint: 'rgba(34,197,94,0.18)', color: '#22c55e', border: 'rgba(34,197,94,0.28)' },
    { label: <><FaLock style={{marginRight:6}}/>Two-Factor Auth</>, href: '/shop/settings/two-factor', tint: 'rgba(59,130,246,0.18)', color: '#3b82f6', border: 'rgba(59,130,246,0.28)' }
  ];
  const priorityStyles: Record<string, { bg: string; color: string }> = {
    High: { bg: 'rgba(229,51,42,0.2)', color: '#e5332a' },
    Medium: { bg: 'rgba(245,158,11,0.2)', color: '#f59e0b' },
    Low: { bg: 'rgba(59,130,246,0.18)', color: '#3b82f6' }
  };

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#e5e7eb',
        fontSize: '18px'
      }}>
        Loading...
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const isManager = user.role === 'manager';

  const _handleSignOut = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    router.push('/auth/login' as Route);
  };

  const handleAddMember = async () => {
    setAddMemberError('');
    setAddMemberSaving(true);
    try {
      const token = localStorage.getItem('token');
      const r = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: newMember.name,
          email: newMember.email,
          phone: newMember.phone,
          password: newMember.password,
          role: newMember.role,
          shopId: (user as any)?.shopId ?? user?.id,
        }),
      });
      if (r.ok) {
        setNewMember({ name: '', role: 'tech', email: '', phone: '', password: '' });
        setShowAddMember(false);
      } else {
        const body = await r.json().catch(() => ({}));
        setAddMemberError(body.error || 'Failed to add team member. Please try again.');
      }
    } catch {
      setAddMemberError('Network error. Please try again.');
    } finally {
      setAddMemberSaving(false);
    }
  };

  const _handleOrderPart = async (partName: string, currentStock: number, reorderLevel: number) => {
    const orderQuantity = reorderLevel * 2;
    try {
      const token = localStorage.getItem('token');
      const r = await fetch('/api/purchase-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          vendor: 'Auto-reorder',
          notes: `Auto-reorder: ${partName}  -  current stock ${currentStock}, order qty ${orderQuantity}`,
          items: [{ partNumber: '', description: partName, qty: orderQuantity, unitCost: 0 }],
        }),
      });
      if (r.ok) {
        // Redirect to purchase orders page so user can complete the PO
        router.push('/shop/purchase-orders' as Route);
      }
    } catch {
      // Silently ignore  -  non-critical path
    }
  };

  const _handleOpenWorkorder = (orderId: string) => {
    router.push(`/workorders/${orderId}` as Route);
  };

  const handleAssign = async (orderId: string, destinationId: string) => {
    setPendingWorkOrders(prev => {
      const order = prev.find(o => o.id === orderId);
      if (!order) return prev;

      if (destinationId === 'roadcall') {
        setRoadcallJobs(current => {
          const exists = current.some(job => job.id === order.id);
          return exists ? current : [...current, { ...order, status: 'Roadcall' }];
        });
      } else {
        setBays(current =>
          current.map(bay => {
            if (bay.id !== destinationId) return bay;
            const exists = bay.jobs.some(job => job.id === order.id);
            return exists ? bay : { ...bay, jobs: [...bay.jobs, { ...order, status: 'In Bay' }] };
          })
        );
      }

      return prev.filter(o => o.id !== orderId);
    });

    // Persist assignment to server
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      await fetch(`/api/workorders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          bayId: destinationId === 'roadcall' ? null : destinationId,
          status: destinationId === 'roadcall' ? 'Roadcall' : 'In Bay',
        }),
      });
    } catch {
      console.error('Failed to persist bay assignment');
    }
  };

  const _handleReturnToPending = (bayId: string, orderId: string) => {
    let moved: Job | undefined;
    setBays(current => {
      const updated = current.map(bay => {
        if (bay.id !== bayId) return bay;
        const job = bay.jobs.find(j => j.id === orderId);
        if (job) {
          moved = job;
        }
        return { ...bay, jobs: bay.jobs.filter(j => j.id !== orderId) };
      });
      return updated;
    });

    if (moved) {
      const movedJob: Job = moved;
      setPendingWorkOrders(prev => [...prev, { ...movedJob, status: 'Pending' }]);
    }
  };

  const _handleReturnRoadcallToPending = (orderId: string) => {
    let moved: Job | undefined;
    setRoadcallJobs(current => {
      moved = current.find(j => j.id === orderId);
      return current.filter(j => j.id !== orderId);
    });
    if (!moved) return;
    const movedJob: Job = moved;
    setPendingWorkOrders(prev => [...prev, { ...movedJob, status: 'Pending' }]);
  };

  return (
    <MobileLayout
      role="shop"
      showSidebar={true}
      sidebarContent={<Sidebar role="shop" isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />}
      topNavContent={
        <>
          <TopNavBar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} showMenuButton={true} />
          <Breadcrumbs />
        </>
      }
    >
      <div style={{maxWidth:1400, margin:'0 auto', padding: sidebarOpen ? '0 32px 32px 32px' : '0 32px 32px 32px'}}>
        <div style={{display:'flex', flexWrap:'nowrap', gap:12, alignItems:'center', margin:'0 0 20px 0', overflowX:'auto', paddingBottom:4}}>
          <span style={{fontSize:13, color:'#9aa3b2', fontWeight:700}}>Quick Actions</span>
          {quickActions.map(action => {
            if (subscriptionPlan && !isPathAllowedForPlan(action.href, subscriptionPlan)) return null;
            if (action.requiresAdmin && !user.isShopAdmin) return null;
            if (action.hideForAdmin && user.isShopAdmin) return null;
            if (action.requiresManagerOrAdmin && !(user.isShopAdmin || isManager)) return null;
            return (
              <Link
                key={action.href}
                href={action.href as Route}
                style={{
                  padding:'10px 14px',
                  background:action.tint,
                  color:action.color,
                  border:`1px solid ${action.border}`,
                  borderRadius:10,
                  fontSize:13,
                  fontWeight:700,
                  textDecoration:'none',
                  whiteSpace:'nowrap',
                  flexShrink:0
                }}
              >
                {action.label}
              </Link>
            );
          })}
        </div>

        {/* Shop Stats */}
        <div style={{display:'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(180px, 1fr))', gap: isMobile ? 10 : 16, marginBottom: isMobile ? 16 : 32}}>
          <div style={{background:'rgba(59,130,246,0.1)', border:'1px solid rgba(59,130,246,0.3)', borderRadius:12, padding:20}}>
            <div style={{fontSize:13, color:'#9aa3b2', marginBottom:8}}>Open Jobs</div>
            <div style={{fontSize:32, fontWeight:700, color:'#3b82f6'}}>{shopStats.openJobs}</div>
          </div>
          <div style={{background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.3)', borderRadius:12, padding:20}}>
            <div style={{fontSize:13, color:'#9aa3b2', marginBottom:8}}>Completed Today</div>
            <div style={{fontSize:32, fontWeight:700, color:'#22c55e'}}>{shopStats.completedToday}</div>
          </div>
          <div style={{background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.3)', borderRadius:12, padding:20}}>
            <div style={{fontSize:13, color:'#9aa3b2', marginBottom:8}}>Today's Revenue</div>
            <div style={{fontSize:32, fontWeight:700, color:'#22c55e'}}>{shopStats.todayRevenue}</div>
          </div>
          <div style={{background:'rgba(168,85,247,0.1)', border:'1px solid rgba(168,85,247,0.3)', borderRadius:12, padding:20}}>
            <div style={{fontSize:13, color:'#9aa3b2', marginBottom:8}}>This Week</div>
            <div style={{fontSize:32, fontWeight:700, color:'#a855f7'}}>{shopStats.weekRevenue}</div>
          </div>
          <div style={{background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.3)', borderRadius:12, padding:20}}>
            <div style={{fontSize:13, color:'#9aa3b2', marginBottom:8}}>Active Techs</div>
            <div style={{fontSize:32, fontWeight:700, color:'#f59e0b'}}>{shopStats.activeTechs}</div>
          </div>
          <div style={{background:'rgba(229,51,42,0.1)', border:'1px solid rgba(229,51,42,0.3)', borderRadius:12, padding:20}}>
            <div style={{fontSize:13, color:'#9aa3b2', marginBottom:8}}>Pending Approvals</div>
            <div style={{fontSize:32, fontWeight:700, color:'#e5332a'}}>{shopStats.pendingApprovals}</div>
          </div>
        </div>

        <div style={{display:'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr', gap: isMobile ? 16 : 24, alignItems:'start'}}>
          {/* Main Column */}
          <div>
            {/* Tall Insight Card above today's schedule */}
            <div style={{background:'rgba(0,0,0,0.35)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:12, padding:24, marginBottom:24, minHeight:800}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, gap:12, flexWrap:'wrap'}}>
                <div>
                  <h2 style={{fontSize:20, fontWeight:700, color:'#e5e7eb'}}>Ops Overview</h2>
                  <div style={{display:'flex', gap:8, marginTop:6, flexWrap:'wrap'}}>
                    <span style={{padding:'4px 10px', background:'rgba(229,51,42,0.16)', color:'#e5332a', borderRadius:12, fontSize:11, fontWeight:700}}>
                      Pending: {pendingWorkOrders.length}
                    </span>
                    <span style={{padding:'4px 10px', background:'rgba(59,130,246,0.16)', color:'#60a5fa', borderRadius:12, fontSize:11, fontWeight:700}}>
                      Bays: {bays.reduce((sum, bay) => sum + bay.jobs.length, 0)} active
                    </span>
                  </div>
                </div>
                <span style={{padding:'4px 10px', background:'rgba(34,197,94,0.2)', color:'#22c55e', borderRadius:12, fontSize:11, fontWeight:700}}>
                  Drag-free handoff
                </span>
              </div>

              <div style={{display:'grid', gridTemplateColumns:'1fr', gap:16, alignItems:'start'}}>
                {/* Pending Queue */}
                <div style={{background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:14, minHeight:220}}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
                    <div style={{fontSize:15, fontWeight:700, color:'#e5e7eb'}}>Pending Queue</div>
                    <span style={{fontSize:12, color:'#9aa3b2'}}>Tap a bay to dispatch</span>
                  </div>
                  <div style={{display:'flex', flexDirection:'column', gap:10}}>
                    {pendingWorkOrders.length === 0 && (
                      <div style={{color:'#9aa3b2', fontSize:13, padding:12, border:'1px dashed rgba(255,255,255,0.15)', borderRadius:10}}>
                        No customers waiting  -  nice work.
                      </div>
                    )}
                    {pendingWorkOrders.map(order => {
                      const style = priorityStyles[order.priority] || priorityStyles.Medium;
                      const destinationOptions = [...bays.map(b => ({ id: b.id, label: b.name })), { id: 'roadcall', label: <><FaTruck style={{marginRight:4}} /> Roadcall</> }];
                      const selected = selectedDestinations[order.id] || destinationOptions[0]?.id || 'roadcall';
                      return (
                        <div key={order.id} style={{background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:12, display:'flex', flexDirection:'column', gap:8}}>
                          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                            <div style={{fontSize:14, fontWeight:700, color:'#e5e7eb'}}>{order.service}</div>
                            <span style={{padding:'4px 8px', background:style.bg, color:style.color, borderRadius:8, fontSize:11, fontWeight:700}}>{order.priority}</span>
                          </div>
                          <div style={{fontSize:12, color:'#9aa3b2'}}>
                            {order.customer} - {order.vehicle} - {order.id}
                          </div>
                          <div style={{display:'flex', gap:8, alignItems:'stretch'}}>
                            <div style={{flex:1, display:'flex', flexDirection:'column', gap:6}}>
                              <div style={{fontSize:12, color:'#9aa3b2'}}>Destination</div>
                              <div style={{background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:4, maxHeight:200, overflowY:'auto', height:'100%'}}>
                                <select
                                  value={selected}
                                  onChange={(e) => setSelectedDestinations(prev => ({ ...prev, [order.id]: e.target.value }))}
                                  size={destinationOptions.length}
                                  style={{width:'100%', background:'transparent', color:'#e5e7eb', border:'none', outline:'none', fontSize:12, cursor:'pointer', height:'100%'}}
                                >
                                  {destinationOptions.map(opt => (
                                    <option key={opt.id} value={opt.id} style={{background:'#111827', color:'#e5e7eb'}}>
                                      {opt.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                            <div style={{display:'flex', alignItems:'flex-end'}}>
                              <button
                                onClick={() => handleAssign(order.id, selected)}
                                style={{padding:'8px 12px', background:'rgba(34,197,94,0.16)', color:'#22c55e', border:'1px solid rgba(34,197,94,0.3)', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer', alignSelf:'stretch'}}
                              >
                                Dispatch to {destinationOptions.find(opt => opt.id === selected)?.label || 'Bay'}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Team Overview */}
            <div style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:24}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20}}>
                <h2 style={{fontSize:20, fontWeight:700, color:'#e5e7eb'}}>Team Status</h2>
                {user.isShopAdmin && (
                  <button onClick={() => setShowAddMember(true)} style={{padding:'8px 16px', background:'#22c55e', color:'white', border:'none', borderRadius:6, cursor:'pointer', fontSize:12, fontWeight:600}}>
                    + Add Team Member
                  </button>
                )}
              </div>
              <div style={{display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:12}}>
                {teamMembers.map((member, idx) => (
                  <div key={idx} style={{background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:16}}>
                    <div style={{display:'flex', alignItems:'center', gap:12, marginBottom:12}}>
                      <span style={{fontSize:32}}>{member.avatar}</span>
                      <div style={{flex:1}}>
                        <div style={{fontSize:15, fontWeight:700, color:'#e5e7eb'}}>{member.name}</div>
                        <div style={{display:'flex', alignItems:'center', gap:6, marginTop:4}}>
                          <span style={{padding:'2px 8px', background:member.status === 'Active' ? 'rgba(34,197,94,0.2)' : 'rgba(245,158,11,0.2)', color:member.status === 'Active' ? '#22c55e' : '#f59e0b', borderRadius:8, fontSize:11, fontWeight:600}}>
                            <FaCircle style={{marginRight:4}} /> {member.status}
                          </span>
                          <span style={{padding:'2px 8px', background:'rgba(59,130,246,0.2)', color:'#3b82f6', borderRadius:8, fontSize:10, fontWeight:600}}>
                            {member.role === 'tech' ? <><FaWrench style={{marginRight:4}} /> Tech</> : <><FaUserTie style={{marginRight:4}} /> Manager</>}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div style={{fontSize:12, color:'#9aa3b2'}}>
                      Assigned Jobs: {member.jobs}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Customer Messages */}
          <div style={{background:'rgba(0,0,0,0.32)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:14, padding:16, boxShadow:'0 10px 30px rgba(0,0,0,0.35)'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
              <h2 style={{fontSize:18, fontWeight:700, color:'#e5e7eb'}}>Customer Messages</h2>
              <span style={{fontSize:12, color:'#9aa3b2'}}>Live inbox</span>
            </div>
            <MessagingCard userId={userId} shopId={shopId} />
          </div>
        </div>

        {/* Shop Bays */}
        <div style={{marginTop: 32}}>
          <ShopBaysCard shopId={shopId} />
        </div>
      </div>

      {/* Add Team Member Modal */}
      {showAddMember && (
        <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000}}>
          <div style={{background:'linear-gradient(135deg, #3d3d3d 0%, #4a4a4a 50%, #525252 100%)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:16, padding:32, maxWidth:500, width:'90%'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24}}>
              <h2 style={{fontSize:24, fontWeight:700, color:'#e5e7eb'}}>Add Team Member</h2>
              <button onClick={() => setShowAddMember(false)} style={{background:'transparent', border:'none', color:'#9aa3b2', fontSize:24, cursor:'pointer', padding:0}}>×</button>
            </div>

            <div style={{marginBottom:20}}>
              <label style={{display:'block', fontSize:13, color:'#9aa3b2', marginBottom:8}}>Role *</label>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
                <button type="button" onClick={() => setNewMember({...newMember, role: 'tech'})} style={{padding:16, background:newMember.role === 'tech' ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.05)', border:`2px solid ${newMember.role === 'tech' ? '#22c55e' : 'rgba(255,255,255,0.1)'}`, borderRadius:8, cursor:'pointer', color:'#e5e7eb', fontSize:14, fontWeight:600}}>
                  <div style={{fontSize:24, marginBottom:8}}><FaWrench style={{marginRight:4}} /></div>
                  Technician
                </button>
                <button type="button" onClick={() => setNewMember({...newMember, role: 'manager'})} style={{padding:16, background:newMember.role === 'manager' ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)', border:`2px solid ${newMember.role === 'manager' ? '#3b82f6' : 'rgba(255,255,255,0.1)'}`, borderRadius:8, cursor:'pointer', color:'#e5e7eb', fontSize:14, fontWeight:600}}>
                  <div style={{fontSize:24, marginBottom:8}}><FaUserTie style={{marginRight:4}} /></div>
                  Manager
                </button>
              </div>
            </div>

            <div style={{marginBottom:20}}>
              <label style={{display:'block', fontSize:13, color:'#9aa3b2', marginBottom:8}}>Full Name *</label>
              <input type="text" value={newMember.name} onChange={(e) => setNewMember({...newMember, name: e.target.value})} placeholder="John Doe" style={{width:'100%', padding:'12px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#e5e7eb', fontSize:14}} />
            </div>

            <div style={{marginBottom:20}}>
              <label style={{display:'block', fontSize:13, color:'#9aa3b2', marginBottom:8}}>Email Address *</label>
              <input type="email" value={newMember.email} onChange={(e) => setNewMember({...newMember, email: e.target.value})} placeholder="john@example.com" style={{width:'100%', padding:'12px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#e5e7eb', fontSize:14}} />
            </div>

            <div style={{marginBottom:20}}>
              <label style={{display:'block', fontSize:13, color:'#9aa3b2', marginBottom:8}}>Phone Number *</label>
              <input type="tel" value={newMember.phone} onChange={(e) => setNewMember({...newMember, phone: e.target.value})} placeholder="(555) 123-4567" style={{width:'100%', padding:'12px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#e5e7eb', fontSize:14}} />
            </div>

            <div style={{marginBottom:20}}>
              <label style={{display:'block', fontSize:13, color:'#9aa3b2', marginBottom:8}}>Set Login Password *</label>
              <input type="password" value={newMember.password} onChange={(e) => setNewMember({...newMember, password: e.target.value})} placeholder="Create password for employee" style={{width:'100%', padding:'12px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#e5e7eb', fontSize:14}} />
              <p style={{fontSize:11, color:'#6b7280', marginTop:6}}>Employee will receive an account and can login with email or phone</p>
            </div>

            {addMemberError && <div style={{background:'rgba(229,51,42,0.12)',border:'1px solid rgba(229,51,42,0.3)',borderRadius:8,padding:'10px 14px',marginBottom:12,color:'#fca5a5',fontSize:13}}>{addMemberError}</div>}

            <div style={{display:'flex', gap:12}}>
              <button onClick={() => { setShowAddMember(false); setAddMemberError(''); }} style={{flex:1, padding:'12px', background:'rgba(255,255,255,0.1)', color:'#e5e7eb', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer'}}>
                Cancel
              </button>
              <button onClick={handleAddMember} disabled={addMemberSaving || !newMember.name || !newMember.email || !newMember.phone || !newMember.password} style={{flex:1, padding:'12px', background:(addMemberSaving || !newMember.name || !newMember.email || !newMember.phone || !newMember.password) ? 'rgba(34,197,94,0.3)' : '#22c55e', color:'white', border:'none', borderRadius:8, fontSize:14, fontWeight:600, cursor:(addMemberSaving || !newMember.name || !newMember.email || !newMember.phone || !newMember.password) ? 'not-allowed' : 'pointer'}}>
                {addMemberSaving ? 'Adding...' : 'Add Member'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Real-Time Work Orders Updates */}
      <RealTimeWorkOrders userId={user.id} />
    </MobileLayout>
  );
}
