'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Shop = {
  id: string;
  name: string;
  location: string;
  status: 'active' | 'pending' | 'suspended';
  owner: string;
  email: string;
  phone: string;
  jobs: number;
  revenue: string;
  rating: number;
  joinedDate: Date;
};

export default function ManageShops() {
  const router = useRouter();
  const [shops, setShops] = useState<Shop[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    const isSuperAdmin = localStorage.getItem('isSuperAdmin');
    if (role !== 'admin' || isSuperAdmin !== 'true') {
      router.push('/auth/login');
      return;
    }
    
    // Fetch all shops (both pending and approved)
    Promise.all([
      fetch('/api/shops/pending').then(res => res.json()),
      fetch('/api/shops/accepted').then(res => res.json())
    ])
      .then(([pendingData, approvedData]) => {
        const allShops: Shop[] = [
          ...pendingData.map((shop: any) => ({
            id: shop.id,
            name: shop.shopName || shop.name,
            location: shop.location,
            status: 'pending' as const,
            owner: shop.ownerName || 'N/A',
            email: shop.email,
            phone: shop.phone,
            jobs: 0,
            revenue: '$0',
            rating: 0,
            joinedDate: new Date(shop.submitted || shop.joinedDate || Date.now())
          })),
          ...approvedData.map((shop: any) => ({
            id: shop.id,
            name: shop.shopName || shop.name,
            location: shop.location,
            status: 'active' as const,
            owner: shop.ownerName || 'N/A',
            email: shop.email,
            phone: shop.phone,
            jobs: shop.jobs || 0,
            revenue: shop.revenue || '$0',
            rating: shop.rating || 0,
            joinedDate: new Date(shop.joinedDate || Date.now())
          }))
        ];
        setShops(allShops);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching shops:', err);
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#22c55e';
      case 'pending': return '#f59e0b';
      case 'suspended': return '#e5332a';
      default: return '#9aa3b2';
    }
  };

  const filteredShops = filterStatus === 'all' ? shops : shops.filter(s => s.status === filterStatus);

  return (
    <div style={{minHeight:'100vh', background:'linear-gradient(135deg, #3d3d3d 0%, #4a4a4a 50%, #525252 100%)'}}>
      <div style={{background:'rgba(0,0,0,0.3)', borderBottom:'1px solid rgba(34,197,94,0.3)', padding:'20px 32px'}}>
        <div style={{maxWidth:1400, margin:'0 auto'}}>
          <Link href="/admin/home" style={{color:'#3b82f6', textDecoration:'none', fontSize:14, fontWeight:600, marginBottom:16, display:'inline-block'}}>
            ← Back to Dashboard
          </Link>
          <h1 style={{fontSize:28, fontWeight:700, color:'#e5e7eb', marginBottom:8}}>🏪 Manage Shops</h1>
          <p style={{fontSize:14, color:'#9aa3b2'}}>Manage all auto repair shops in the network</p>
        </div>
      </div>

      <div style={{maxWidth:1400, margin:'0 auto', padding:32}}>
        <div style={{marginBottom:24}}>
          <label style={{display:'block', fontSize:12, color:'#9aa3b2', marginBottom:8, fontWeight:600}}>Filter by Status</label>
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{padding:'10px 16px', background:'rgba(0,0,0,0.3)', color:'#e5e7eb', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer', minWidth:200}}
          >
            <option value="all">All Shops</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>

        {loading ? (
          <div style={{textAlign:'center', padding:60, color:'#9aa3b2'}}>
            <div style={{fontSize:48, marginBottom:16}}>⏳</div>
            <div>Loading shops...</div>
          </div>
        ) : filteredShops.length === 0 ? (
          <div style={{textAlign:'center', padding:60, color:'#9aa3b2'}}>
            <div style={{fontSize:48, marginBottom:16}}>🏪</div>
            <div>No shops found</div>
          </div>
        ) : (
          <div style={{display:'grid', gap:16}}>
            {filteredShops.map((shop) => (
              <div key={shop.id} style={{background:'rgba(0,0,0,0.3)', border:`1px solid rgba(${getStatusColor(shop.status)}50)`, borderRadius:12, padding:24}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16}}>
                <div>
                  <div style={{display:'flex', alignItems:'center', gap:12, marginBottom:8}}>
                    <h2 style={{fontSize:20, fontWeight:700, color:'#e5e7eb'}}>{shop.name}</h2>
                    <span style={{padding:'4px 12px', background:`rgba(${getStatusColor(shop.status)}20)`, color:getStatusColor(shop.status), borderRadius:8, fontSize:11, fontWeight:600}}>
                      {shop.status.toUpperCase()}
                    </span>
                  </div>
                  <div style={{fontSize:14, color:'#9aa3b2'}}>📍 {shop.location} • Owner: {shop.owner}</div>
                </div>
              </div>

              <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))', gap:12, marginBottom:16, padding:16, background:'rgba(255,255,255,0.05)', borderRadius:8}}>
                <div>
                  <div style={{fontSize:11, color:'#6b7280', marginBottom:4}}>Email</div>
                  <div style={{fontSize:14, color:'#e5e7eb', fontWeight:600}}>{shop.email}</div>
                </div>
                <div>
                  <div style={{fontSize:11, color:'#6b7280', marginBottom:4}}>Phone</div>
                  <div style={{fontSize:14, color:'#e5e7eb', fontWeight:600}}>{shop.phone}</div>
                </div>
                <div>
                  <div style={{fontSize:11, color:'#6b7280', marginBottom:4}}>Jobs Completed</div>
                  <div style={{fontSize:18, color:'#3b82f6', fontWeight:700}}>{shop.jobs}</div>
                </div>
                <div>
                  <div style={{fontSize:11, color:'#6b7280', marginBottom:4}}>Revenue</div>
                  <div style={{fontSize:18, color:'#22c55e', fontWeight:700}}>{shop.revenue}</div>
                </div>
                {shop.rating > 0 && (
                  <div>
                    <div style={{fontSize:11, color:'#6b7280', marginBottom:4}}>Rating</div>
                    <div style={{fontSize:18, color:'#fbbf24', fontWeight:700}}>⭐ {shop.rating}</div>
                  </div>
                )}
              </div>

              <div style={{display:'flex', gap:12}}>
                <button style={{flex:1, padding:'12px', background:'rgba(59,130,246,0.2)', color:'#3b82f6', border:'1px solid rgba(59,130,246,0.3)', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer'}}>
                  View Details
                </button>
                {shop.status === 'active' && (
                  <button style={{padding:'12px 24px', background:'rgba(229,51,42,0.2)', color:'#e5332a', border:'1px solid rgba(229,51,42,0.3)', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer'}}>
                    Suspend
                  </button>
                )}
                {shop.status === 'pending' && (
                  <button style={{padding:'12px 24px', background:'rgba(34,197,94,0.2)', color:'#22c55e', border:'1px solid rgba(34,197,94,0.3)', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer'}}>
                    Approve
                  </button>
                )}
              </div>
            </div>
          ))}
          </div>
        )}
      </div>
    </div>
  );
}
