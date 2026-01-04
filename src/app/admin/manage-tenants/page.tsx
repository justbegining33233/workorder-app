'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Tenant = {
  id: string;
  name: string;
  domain: string;
  plan: string;
  shops: number;
  users: number;
  status: 'active' | 'suspended' | 'trial';
  joinedDate: Date;
  monthlyRevenue: string;
};

export default function ManageTenants() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    const isSuperAdmin = localStorage.getItem('isSuperAdmin');
    if (role !== 'admin' || isSuperAdmin !== 'true') {
      router.push('/auth/login');
      return;
    }
    
    // Fetch shop data as tenants
    const fetchTenants = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/shops/accepted', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          const shops = await response.json();
          // Transform shops into tenant format
          const tenantData = shops.map((shop: any) => ({
            id: shop.id,
            name: shop.shopName,
            domain: `${shop.shopName.toLowerCase().replace(/\s+/g, '-')}.fixtray.com`,
            plan: shop.completedJobs > 50 ? 'Professional' : shop.completedJobs > 20 ? 'Business' : 'Trial',
            shops: 1,
            users: shop.techCount || 1,
            status: shop.status === 'approved' ? 'active' : 'trial',
            joinedDate: new Date(shop.createdAt),
            monthlyRevenue: shop.totalRevenue || '$0.00',
          }));
          setTenants(tenantData);
        }
      } catch (error) {
        console.error('Error fetching tenants:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTenants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#22c55e';
      case 'trial': return '#f59e0b';
      case 'suspended': return '#e5332a';
      default: return '#9aa3b2';
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'Enterprise': return '#8b5cf6';
      case 'Professional': return '#3b82f6';
      case 'Business': return '#22c55e';
      case 'Trial': return '#f59e0b';
      default: return '#9aa3b2';
    }
  };

  return (
    <div style={{minHeight:'100vh', background:'linear-gradient(135deg, #3d3d3d 0%, #4a4a4a 50%, #525252 100%)'}}>
      <div style={{background:'rgba(0,0,0,0.3)', borderBottom:'1px solid rgba(59,130,246,0.3)', padding:'20px 32px'}}>
        <div style={{maxWidth:1400, margin:'0 auto'}}>
          <Link href="/admin/home" style={{color:'#3b82f6', textDecoration:'none', fontSize:14, fontWeight:600, marginBottom:16, display:'inline-block'}}>
            ← Back to Dashboard
          </Link>
          <h1 style={{fontSize:28, fontWeight:700, color:'#e5e7eb', marginBottom:8}}>🏢 Manage Tenants</h1>
          <p style={{fontSize:14, color:'#9aa3b2'}}>Manage all tenant organizations and subscriptions</p>
        </div>
      </div>

      <div style={{maxWidth:1400, margin:'0 auto', padding:32}}>
        {loading ? (
          <div style={{textAlign:'center', padding:48, color:'#9aa3b2'}}>
            <div style={{fontSize:32, marginBottom:16}}>⏳</div>
            <div>Loading tenants...</div>
          </div>
        ) : tenants.length === 0 ? (
          <div style={{textAlign:'center', padding:48, color:'#9aa3b2'}}>
            <div style={{fontSize:32, marginBottom:16}}>🏢</div>
            <div>No tenants found</div>
          </div>
        ) : (
          <div style={{display:'grid', gap:16}}>
            {tenants.map((tenant) => (
            <div key={tenant.id} style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(59,130,246,0.3)', borderRadius:12, padding:24}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16}}>
                <div>
                  <div style={{display:'flex', alignItems:'center', gap:12, marginBottom:8}}>
                    <h2 style={{fontSize:20, fontWeight:700, color:'#e5e7eb'}}>{tenant.name}</h2>
                    <span style={{padding:'4px 12px', background:`rgba(${getStatusColor(tenant.status)}20)`, color:getStatusColor(tenant.status), borderRadius:8, fontSize:11, fontWeight:600}}>
                      {tenant.status.toUpperCase()}
                    </span>
                    <span style={{padding:'4px 12px', background:`rgba(${getPlanColor(tenant.plan)}20)`, color:getPlanColor(tenant.plan), borderRadius:8, fontSize:11, fontWeight:600}}>
                      {tenant.plan}
                    </span>
                  </div>
                  <div style={{fontSize:14, color:'#9aa3b2'}}>🌐 {tenant.domain}</div>
                </div>
              </div>

              <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))', gap:12, marginBottom:16, padding:16, background:'rgba(255,255,255,0.05)', borderRadius:8}}>
                <div>
                  <div style={{fontSize:11, color:'#6b7280', marginBottom:4}}>Shops</div>
                  <div style={{fontSize:18, color:'#3b82f6', fontWeight:700}}>{tenant.shops}</div>
                </div>
                <div>
                  <div style={{fontSize:11, color:'#6b7280', marginBottom:4}}>Users</div>
                  <div style={{fontSize:18, color:'#8b5cf6', fontWeight:700}}>{tenant.users}</div>
                </div>
                <div>
                  <div style={{fontSize:11, color:'#6b7280', marginBottom:4}}>Monthly Revenue</div>
                  <div style={{fontSize:18, color:'#22c55e', fontWeight:700}}>{tenant.monthlyRevenue}</div>
                </div>
                <div>
                  <div style={{fontSize:11, color:'#6b7280', marginBottom:4}}>Joined</div>
                  <div style={{fontSize:14, color:'#e5e7eb', fontWeight:600}}>{tenant.joinedDate.toLocaleDateString()}</div>
                </div>
              </div>

              <div style={{display:'flex', gap:12}}>
                <button 
                  onClick={() => { setSelectedTenant(tenant); setShowDetails(true); }}
                  style={{flex:1, padding:'12px', background:'rgba(59,130,246,0.2)', color:'#3b82f6', border:'1px solid rgba(59,130,246,0.3)', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer'}}
                >
                  View Details
                </button>
                <button style={{padding:'12px 24px', background:'rgba(255,255,255,0.1)', color:'#e5e7eb', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer'}}>
                  Manage
                </button>
              </div>
            </div>
          ))}
          </div>
        )}
      </div>

      {showDetails && selectedTenant && (
        <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.8)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:32}}>
          <div style={{background:'linear-gradient(135deg, #3d3d3d 0%, #4a4a4a 50%, #525252 100%)', border:'2px solid rgba(59,130,246,0.3)', borderRadius:16, padding:32, maxWidth:600, width:'100%'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24}}>
              <h2 style={{fontSize:24, fontWeight:700, color:'#e5e7eb'}}>Tenant Details</h2>
              <button onClick={() => setShowDetails(false)} style={{padding:'8px 16px', background:'rgba(255,255,255,0.1)', color:'#e5e7eb', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer'}}>
                ✕ Close
              </button>
            </div>
            <div style={{fontSize:16, color:'#e5e7eb', lineHeight:1.8}}>
              <p><strong>Name:</strong> {selectedTenant.name}</p>
              <p><strong>Domain:</strong> {selectedTenant.domain}</p>
              <p><strong>Plan:</strong> {selectedTenant.plan}</p>
              <p><strong>Status:</strong> {selectedTenant.status}</p>
              <p><strong>Shops:</strong> {selectedTenant.shops}</p>
              <p><strong>Users:</strong> {selectedTenant.users}</p>
              <p><strong>Revenue:</strong> {selectedTenant.monthlyRevenue}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
