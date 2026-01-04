'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Shop {
  id: string;
  name: string;
  distance: string;
  rating: number;
  address: string;
  services: string[];
}

export default function FindShops() {
  const [searchTerm, setSearchTerm] = useState('');
  const [shops] = useState<Shop[]>([]);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    const name = localStorage.getItem('userName') || '';
    setUserName(name);

    if (role !== 'customer') {
      window.location.href = '/auth/login';
      return;
    }
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    window.location.href = '/auth/login';
  };

  const filteredShops = shops.filter(shop =>
    shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shop.services.some(service => service.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div style={{minHeight:'100vh', background:'linear-gradient(135deg, #3d3d3d 0%, #4a4a4a 50%, #525252 100%)'}}>
      {/* Header */}
      <div style={{background:'rgba(0,0,0,0.3)', borderBottom:'1px solid rgba(229,51,42,0.3)', padding:'16px 32px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <div style={{display:'flex', alignItems:'center', gap:24}}>
          <Link href="/customer/dashboard" style={{fontSize:24, fontWeight:900, color:'#e5332a', textDecoration:'none'}}>FixTray</Link>
          <div>
            <div style={{fontSize:20, fontWeight:700, color:'#e5e7eb'}}>Customer Portal</div>
            <div style={{fontSize:12, color:'#9aa3b2'}}>Find Shops</div>
          </div>
        </div>
        <div style={{display:'flex', alignItems:'center', gap:16}}>
          <span style={{fontSize:14, color:'#9aa3b2'}}>Welcome, {userName}</span>
          <button onClick={handleSignOut} style={{padding:'8px 16px', background:'#e5332a', color:'white', border:'none', borderRadius:6, cursor:'pointer', fontSize:13, fontWeight:600}}>
            Sign Out
          </button>
        </div>
      </div>

      <div style={{maxWidth:1200, margin:'0 auto', padding:32}}>
        <h1 style={{fontSize:32, fontWeight:700, color:'#e5e7eb', marginBottom:32}}>Find Auto Shops</h1>

        {/* Search Bar */}
        <div style={{marginBottom:32}}>
          <input
            type="text"
            placeholder="Search by shop name or service..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width:'100%',
              padding:'16px',
              background:'rgba(0,0,0,0.3)',
              border:'1px solid rgba(255,255,255,0.1)',
              borderRadius:8,
              color:'#e5e7eb',
              fontSize:16,
              outline:'none'
            }}
          />
        </div>

        {/* Shop Results */}
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(350px, 1fr))', gap:24}}>
          {filteredShops.map(shop => (
            <div key={shop.id} style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:24}}>
              <div style={{marginBottom:16}}>
                <h3 style={{fontSize:20, fontWeight:700, color:'#e5e7eb', marginBottom:8}}>{shop.name}</h3>
                <div style={{display:'flex', alignItems:'center', gap:16, marginBottom:12}}>
                  <span style={{fontSize:14, color:'#9aa3b2'}}>📍 {shop.distance}</span>
                  <span style={{fontSize:14, color:'#9aa3b2'}}>⭐ {shop.rating}</span>
                </div>
                <div style={{fontSize:14, color:'#9aa3b2', marginBottom:12}}>{shop.address}</div>
                <div style={{display:'flex', flexWrap:'wrap', gap:8, marginBottom:16}}>
                  {shop.services.map(service => (
                    <span key={service} style={{padding:'4px 8px', background:'rgba(59,130,246,0.2)', color:'#3b82f6', borderRadius:6, fontSize:12, fontWeight:600}}>
                      {service}
                    </span>
                  ))}
                </div>
              </div>
              <div style={{display:'flex', gap:12}}>
                <button style={{
                  flex:1,
                  padding:'12px',
                  background:'#3b82f6',
                  color:'white',
                  border:'none',
                  borderRadius:8,
                  fontSize:14,
                  fontWeight:600,
                  cursor:'pointer'
                }}>
                  View Details
                </button>
                <button style={{
                  flex:1,
                  padding:'12px',
                  background:'rgba(34,197,94,0.1)',
                  color:'#22c55e',
                  border:'1px solid rgba(34,197,94,0.3)',
                  borderRadius:8,
                  fontSize:14,
                  fontWeight:600,
                  cursor:'pointer'
                }}>
                  Book Appointment
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredShops.length === 0 && (
          <div style={{textAlign:'center', padding:40, color:'#9aa3b2'}}>
            No shops found matching your search.
          </div>
        )}

        {/* Back to Dashboard */}
        <div style={{marginTop:32, textAlign:'center'}}>
          <Link href="/customer/dashboard" style={{
            padding:'12px 24px',
            background:'#3b82f6',
            color:'white',
            border:'none',
            borderRadius:8,
            fontSize:16,
            fontWeight:600,
            textDecoration:'none',
            cursor:'pointer'
          }}>
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}