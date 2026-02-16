'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import TimeClock from '@/components/TimeClock';
import TechLiveMap from '@/components/TechLiveMap';
import TopNavBar from '@/components/TopNavBar';
import Sidebar from '@/components/Sidebar';
import Breadcrumbs from '@/components/Breadcrumbs';
import RealTimeWorkOrders from '@/components/RealTimeWorkOrders';
import MobileLayout from '@/components/MobileLayout';
import { useRequireAuth } from '@/contexts/AuthContext';

export default function TechHome() {
  const router = useRouter();
  const { user, isLoading } = useRequireAuth(['tech']);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [todayJobs, setTodayJobs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('job-creation');
  const [techProfile, setTechProfile] = useState<any>(null);
  const [messageUnreadCount, setMessageUnreadCount] = useState(0);
  const [shopProfile, setShopProfile] = useState<any>(null);
  const [shopCoords, setShopCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [roadCalls, setRoadCalls] = useState<any[]>([]);
  const [partsVendors, setPartsVendors] = useState<{ vendor: string; address?: string; poId?: string }[]>([]);
  const [shopStats] = useState({
    openJobs: 0,
    completedToday: 0,
    partsOrdered: 0,
    revenue: '$0'
  });

  // Initialize data when user is available
  useEffect(() => {
    if (!user) return;
    // Fetch shop profile if shopId exists
    if (user.shopId) {
      fetchShopProfile(user.shopId);
    }
    // Fetch tech profile
    fetchTechProfile(user.id);
    // Fetch assigned work orders
    fetchTodayJobs(user.id);
    // Fetch unread message count
    fetchMessageUnreadCount();
    // Set up auto-refresh every 10 seconds
    const refreshInterval = setInterval(() => {
      fetchTechProfile(user.id);
      fetchTodayJobs(user.id);
      fetchMessageUnreadCount();
    }, 10000);
    return () => clearInterval(refreshInterval);
  }, [user]);

  // Fetch shop profile and set coordinates
  const fetchShopProfile = async (shopId: string) => {
    try {
      const token = localStorage.getItem('token');
      // Attempt authenticated fetch first
      let response = await fetch(`/api/shops/${shopId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // If auth failed, try without Authorization header (public fallback)
      if (response.status === 401 || response.status === 403) {
        console.warn('Shop fetch returned', response.status, '— retrying without Authorization header');
        response = await fetch(`/api/shops/${shopId}`);
      }

      if (response.ok) {
        const data = await response.json();
        // Some routes return { shop } and others might return shop directly
        const shop = data?.shop ?? data;
        console.log('✅ [SHOP FETCH] Success:', shop);
        setShopProfile(shop);
        // Use lat/lng if present, otherwise geocode address
        if (shop?.latitude && shop?.longitude) {
          setShopCoords({ latitude: shop.latitude, longitude: shop.longitude });
        } else if (shop?.address) {
          geocodeAddress(shop.address, shop.city, shop.state, shop.zipCode);
        }
      } else {
        // Read response body for helpful debugging info
        let bodyText = '';
        try { bodyText = await response.text(); } catch (e) { bodyText = '<no body>'; }
        const msg = `status:${response.status} body:${bodyText}`;
        console.warn('❌ [SHOP FETCH] Failed', msg);
        setShopProfile(undefined);
      }
    } catch (error) {
      console.error('Error fetching shop profile:', error);
      setShopProfile(undefined);
    }
  };

  // Geocode address to lat/lng using OpenStreetMap Nominatim
  const geocodeAddress = async (address: string, city?: string, state?: string, zip?: string) => {
    try {
      let query = encodeURIComponent([address, city, state, zip].filter(Boolean).join(', '));
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${query}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data && data.length > 0) {
        setShopCoords({ latitude: parseFloat(data[0].lat), longitude: parseFloat(data[0].lon) });
      }
    } catch (error) {
      console.error('Geocoding failed:', error);
    }
  };


  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #3d3d3d 0%, #4a4a4a 50%, #525252 100%)',
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

  // If no user, the useRequireAuth hook will handle redirect
  if (!user) {
    return null;
  }

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

  const fetchMessageUnreadCount = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const response = await fetch('/api/messages', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setMessageUnreadCount(data?.totalUnread || 0);
      }
    } catch (error) {
      console.error('Error fetching unread messages:', error);
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
    { title: 'Messages', description: 'View and respond to messages', icon: '💬', link: '/tech/messages', badge: messageUnreadCount },
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
    <MobileLayout
      role="tech"
      showSidebar={true}
      sidebarContent={<Sidebar role="tech" isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />}
      topNavContent={
        <>
          <TopNavBar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} showMenuButton={true} />
          <Breadcrumbs />
        </>
      }
    >
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

            {/* Live Shop Location Map */}
            <div style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, marginTop:32, marginBottom:32, overflow:'hidden', minHeight:520, display:'flex', flexDirection:'column'}}>
              <h3 style={{color:'#e5e7eb', margin:'16px 0 0 16px', fontSize:16, fontWeight:700}}>📍 Shop Location</h3>
              <div style={{flex:1, minHeight:260, display:'flex', flexDirection:'column'}}>
                {shopCoords ? (
                  <div style={{display:'flex', flex:1}}>
                    {/* Map area: 7/8 */}
                    <div style={{flex:7, padding:16, display:'flex', flexDirection:'column'}}>
                      <div style={{flex:1, borderRadius:8, overflow:'hidden', display:'flex'}}>
                        <div style={{flex:1}}>
                          <TechLiveMap workOrderId="shop-location" initialLocation={shopCoords} techName={shopProfile?.shopName || 'Shop'} />
                        </div>
                      </div>
                    </div>

                    {/* Right-side menu: 1/8 - Road Call / Parts / User Location */}
                    <div style={{flex:1, borderLeft:'1px solid rgba(255,255,255,0.05)', display:'flex', flexDirection:'column', padding:'12px 12px', gap:12}}>
                      {/* Section 1: Road Call */}
                      <div style={{borderRadius:8, padding:12, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.03)'}}>
                        <div style={{fontSize:15, fontWeight:800, color:'#e5e7eb'}}>🚨 Road Call</div>
                        <div style={{height:2, background:'rgba(255,255,255,0.06)', margin:'8px 0'}} />

                        {/* compact WO list */}
                        <div style={{minHeight:48, marginBottom:8}}>
                          {roadCalls.length === 0 ? (
                            <div style={{fontSize:12, color:'#9aa3b2'}}>No active road calls</div>
                          ) : (
                            <div style={{display:'flex', flexDirection:'column', gap:6}}>
                              {roadCalls.map((wo: any) => (
                                <div key={wo.id} style={{fontSize:13, fontWeight:700, color:'#e5e7eb'}}>{`WO-${wo.id.substring(0,8)}`}</div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div style={{display:'flex', justifyContent:'space-between', gap:8}}>
                          <button id="toggle-roadcalls" onClick={async (ev) => {
                            const btn = ev.currentTarget as HTMLButtonElement;
                            const showing = btn.dataset.showing === '1';
                            if (showing) {
                              window.dispatchEvent(new CustomEvent('map:clear_markers', { detail: { type: 'roadcall' } }));
                              setRoadCalls([]);
                              btn.dataset.showing = '0';
                              btn.textContent = 'Show';
                              return;
                            }
                            try {
                              const token = localStorage.getItem('token');
                              const shopId = user?.shopId;
                              if (!shopId) return alert('No shopId');
                              const res = await fetch(`/api/workorders?shopId=${shopId}&status=assigned,in-progress`, { headers: { Authorization: `Bearer ${token}` } });
                              if (!res.ok) return alert('Failed to fetch road calls');
                              const data = await res.json();
                              const wos = data.workOrders || [];
                              setRoadCalls(wos);
                              const markers: any[] = wos.map((wo: any) => wo.location).filter((l: any) => l && l.latitude !== undefined && l.longitude !== undefined).map((l: any) => ({ latitude: l.latitude, longitude: l.longitude, title: 'Road Call' }));
                              window.dispatchEvent(new CustomEvent('map:add_markers', { detail: { type: 'roadcall', markers } }));
                              btn.dataset.showing = '1';
                              btn.textContent = 'Hide';
                            } catch (err) { console.error(err); alert('Error loading road calls'); }
                          }} style={{padding:8, borderRadius:8, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', color:'#e5e7eb', cursor:'pointer'}}>Show</button>

                          <a href="/workorders/new?serviceLocation=roadside" style={{display:'inline-block', padding:'8px 10px', background:'#e5332a', color:'white', borderRadius:6, textDecoration:'none', fontWeight:700, fontSize:13}}>Create Road Call</a>
                        </div>
                      </div>

                      {/* Section 2: Parts */}
                      <div style={{borderRadius:8, padding:12, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.03)'}}>
                        <div style={{fontSize:15, fontWeight:800, color:'#e5e7eb'}}>🔩 Parts</div>
                        <div style={{height:2, background:'rgba(255,255,255,0.06)', margin:'8px 0 12px'}} />

                        {/* Show vendor addresses from recent POs when available */}
                        <div style={{minHeight:48, marginBottom:8}}>
                          {partsVendors.length === 0 ? (
                            <div style={{fontSize:12, color:'#9aa3b2'}}>No recent POs — shop pickup shown on map</div>
                          ) : (
                            <div style={{display:'flex', flexDirection:'column', gap:6}}>
                              {partsVendors.map(p => (
                                <div key={p.poId || p.vendor} style={{fontSize:13, fontWeight:700, color:'#e5e7eb'}}>{`${p.vendor}${p.address ? ` - ${p.address}` : ''}`}</div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div style={{display:'flex', gap:8, alignItems:'center'}}>
                          <button id="toggle-parts" onClick={async (ev) => {
                            const btn = ev.currentTarget as HTMLButtonElement;
                            const showing = btn.dataset.showing === '1';
                            if (showing) {
                              window.dispatchEvent(new CustomEvent('map:clear_markers', { detail: { type: 'parts' } }));
                              setPartsVendors([]);
                              btn.dataset.showing = '0'; btn.textContent = 'Show';
                              return;
                            }

                            try {
                              if (!user?.shopId) return alert('No shopId');
                              const token = localStorage.getItem('token');
                              const poRes = await fetch(`/api/purchase-orders?shopId=${user.shopId}`, { headers: { Authorization: `Bearer ${token}` } });

                              if (!poRes.ok) {
                                window.dispatchEvent(new CustomEvent('map:add_markers', { detail: { type: 'parts', markers: [{ latitude: shopCoords?.latitude, longitude: shopCoords?.longitude, title: 'Parts - Shop' }] } }));
                                setPartsVendors([{ vendor: shopProfile?.shopName || 'Shop', address: shopProfile?.address }]);
                                btn.dataset.showing = '1'; btn.textContent = 'Hide';
                                return;
                              }

                              const { orders } = await poRes.json();
                              const vendors = (orders || []).filter((o: any) => o.vendor).map((o: any) => ({ id: o.id, vendor: o.vendor, vendorAddress: o.vendorAddress || null }));

                              const vendorAddressMap: Record<string, string> = {
                                'NAPA Auto Parts': '2001 W 3rd St, Anytown, PA',
                                'AutoZone Commercial': '123 Commerce Dr, Anytown, PA',
                                "O'Reilly Auto Parts": '500 Service Blvd, Anytown, PA',
                                'WORLDPAC': '800 Distribution Way, Anytown, PA',
                                'CARQUEST': '400 Parts Ave, Anytown, PA'
                              };

                              const markers: any[] = [];
                              const vendorList: any[] = [];

                              for (const v of vendors) {
                                const vendorName = v.vendor;
                                let resolvedAddr = v.vendorAddress || vendorAddressMap[vendorName] || null;
                                let lat: number | null = null;
                                let lon: number | null = null;

                                if (resolvedAddr) {
                                  try {
                                    const q = encodeURIComponent(resolvedAddr);
                                    const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${q}`);
                                    const geoData = await geoRes.json();
                                    if (geoData && geoData.length > 0) {
                                      lat = parseFloat(geoData[0].lat);
                                      lon = parseFloat(geoData[0].lon);
                                    }
                                  } catch (err) { console.warn('Vendor geocode failed', err); }
                                }

                                if ((lat === null || lon === null) && !resolvedAddr) {
                                  try {
                                    const q = encodeURIComponent(vendorName + ' parts store');
                                    const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${q}`);
                                    const geoData = await geoRes.json();
                                    if (geoData && geoData.length > 0) {
                                      lat = parseFloat(geoData[0].lat);
                                      lon = parseFloat(geoData[0].lon);
                                      resolvedAddr = geoData[0].display_name || vendorName;
                                    }
                                  } catch (err) { console.warn('Vendor-name geocode failed', err); }
                                }

                                if (lat !== null && lon !== null) {
                                  markers.push({ latitude: lat, longitude: lon, title: `Parts - ${vendorName}`, popup: `${vendorName} (PO:${v.id})` });
                                  vendorList.push({ vendor: vendorName, address: resolvedAddr || undefined, poId: v.id });
                                } else if (shopCoords) {
                                  markers.push({ latitude: shopCoords.latitude, longitude: shopCoords.longitude, title: `Parts - ${vendorName} (shop fallback)`, popup: `${vendorName} (PO:${v.id})` });
                                  vendorList.push({ vendor: vendorName, address: shopProfile?.address || undefined, poId: v.id });
                                }
                              }

                              if (markers.length === 0) {
                                markers.push({ latitude: shopCoords?.latitude, longitude: shopCoords?.longitude, title: 'Parts - Shop' });
                                vendorList.push({ vendor: shopProfile?.shopName || 'Shop', address: shopProfile?.address || undefined });
                              }

                              setPartsVendors(vendorList);
                              window.dispatchEvent(new CustomEvent('map:add_markers', { detail: { type: 'parts', markers } }));
                              btn.dataset.showing = '1'; btn.textContent = 'Hide';
                            } catch (err) {
                              console.error('Error loading parts vendors', err);
                              alert('Failed to load parts pickup locations');
                            }
                          }} style={{padding:8, borderRadius:8, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', color:'#e5e7eb', cursor:'pointer'}}>Show</button>

                          <a href="/tech/inventory" style={{display:'inline-block', padding:'8px 10px', background:'#10b981', color:'white', borderRadius:6, textDecoration:'none', fontWeight:700, fontSize:13}}>Open Inventory</a>
                        </div>
                      </div>

                      {/* Section 3: User Location (share if permitted) */}
                      <div style={{borderRadius:8, padding:8, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.03)'}}>
                        <div style={{fontSize:13, fontWeight:700, color:'#e5e7eb', marginBottom:6}}>📍 Your Location</div>
                        <div style={{fontSize:12, color:'#9aa3b2', marginBottom:8}}>Share your live location on the map (optional)</div>
                        <div style={{display:'flex', gap:8}}>
                          <button id="share-location-btn" onClick={async () => {
                            try {
                              if (!('geolocation' in navigator)) { alert('Geolocation not supported'); return; }
                              // request one-time position then start watch
                              const pos = await new Promise<GeolocationPosition>((res, rej) => navigator.geolocation.getCurrentPosition(res, rej));
                              const lat = pos.coords.latitude; const lng = pos.coords.longitude;
                              // dispatch event so TechLiveMap will show the user's marker
                              window.dispatchEvent(new CustomEvent('tech-location-updated', { detail: { location: { latitude: lat, longitude: lng }, workOrderId: 'shop-location' } }));
                              const el = document.getElementById('user-loc-display'); if (el) el.textContent = `You: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
                              // start watch to update continuously
                              const watchId = navigator.geolocation.watchPosition((p) => {
                                window.dispatchEvent(new CustomEvent('tech-location-updated', { detail: { location: { latitude: p.coords.latitude, longitude: p.coords.longitude }, workOrderId: 'shop-location' } }));
                                const el = document.getElementById('user-loc-display');
                                if (el) el.textContent = `You: ${p.coords.latitude.toFixed(5)}, ${p.coords.longitude.toFixed(5)}`;
                              });
                              (window as any).__shop_location_watch = watchId;
                              (document.getElementById('share-location-btn') as HTMLButtonElement).style.display = 'none';
                              const stopBtn = document.getElementById('stop-share-btn') as HTMLButtonElement | null;
                              if (stopBtn) stopBtn.style.display = 'inline-block';
                            } catch (err) { console.error('Location error', err); alert('Failed to get location'); }
                          }} style={{flex:1, padding:8, borderRadius:6, background:'#3b82f6', color:'white', border:'none', fontWeight:700}}>Share</button>
                          <button id="stop-share-btn" onClick={() => {
                            const id = (window as any).__shop_location_watch;
                            if (id !== undefined) { navigator.geolocation.clearWatch(id); (window as any).__shop_location_watch = undefined; }
                            // dispatch clear event to remove user marker
                            window.dispatchEvent(new CustomEvent('tech-location-updated', { detail: { workOrderId: 'shop-location', clear: true } }));
                            (document.getElementById('stop-share-btn') as HTMLButtonElement).style.display = 'none';
                            (document.getElementById('share-location-btn') as HTMLButtonElement).style.display = 'inline-block';
                          }} style={{display:'none', padding:8, borderRadius:6, background:'#ef4444', color:'white', border:'none', fontWeight:700}}>Stop</button>
                        </div>
                        <div id="user-loc-display" style={{marginTop:8, fontSize:12, color:'#9aa3b2'}}></div>
                      </div>

                      <div style={{flex:1}} />
                      <div style={{fontSize:10, color:'#9aa3b2', textAlign:'center'}}>Leaflet | © OpenStreetMap contributors</div>
                    </div>
                  </div>
                ) : (
                  <div style={{color:'#9aa3b2', textAlign:'center', marginTop:40}}>Loading map...</div>
                )}
              </div>
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
                    whiteSpace:'nowrap',
                    display:'flex',
                    alignItems:'center',
                    gap:8
                  }}
                >
                  📍 Field Tools
                  {messageUnreadCount > 0 && (
                    <span style={{
                      background:'#ef4444',
                      color:'white',
                      borderRadius:999,
                      padding:'2px 8px',
                      fontSize:11,
                      fontWeight:700,
                      lineHeight:1
                    }}>
                      {messageUnreadCount}
                    </span>
                  )}
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
                        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12}}>
                          <div style={{fontSize:48}}>{tool.icon}</div>
                          {'badge' in tool && (tool as any).badge > 0 ? (
                            <div style={{background:'#ef4444', color:'white', borderRadius:999, padding:'4px 10px', fontSize:12, fontWeight:700}}>
                              {(tool as any).badge}
                            </div>
                          ) : null}
                        </div>
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
            <TimeClock techId={user.id} shopId={user.shopId || ''} techName={user.name} />

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

            {/* Real-Time Work Orders Updates */}
            <RealTimeWorkOrders userId={user.id} />
          </div>
        </div>
    </MobileLayout>
  );
}
