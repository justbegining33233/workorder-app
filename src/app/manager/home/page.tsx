'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import TimeClock from '@/components/TimeClock';
import MessagingCard from '@/components/MessagingCard';

export default function ManagerHome() {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState('');
  const [shopId, setShopId] = useState('');
  const [shopName, setShopName] = useState('');
  const [inventoryRequests, setInventoryRequests] = useState<any[]>([]);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [newRequest, setNewRequest] = useState({
    itemName: '',
    quantity: 1,
    reason: '',
    urgency: 'normal',
  });

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    const name = localStorage.getItem('userName');
    const id = localStorage.getItem('userId');
    const shop = localStorage.getItem('shopId');
    
    if (role !== 'manager') {
      router.push('/auth/login');
      return;
    }
    
    setUserName(name || '');
    setUserId(id || '');
    setShopId(shop || '');
    
    if (shop) {
      fetchShopName(shop);
      fetchInventoryRequests(shop);
    }
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

  const fetchInventoryRequests = async (shop: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/shop/inventory-requests?shopId=${shop}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const { requests } = await response.json();
        setInventoryRequests(requests);
      }
    } catch (error) {
      console.error('Error fetching inventory requests:', error);
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

  const handleSubmitRequest = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/shop/inventory-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          shopId,
          requestedById: userId,
          ...newRequest,
        }),
      });

      if (response.ok) {
        alert('Inventory request submitted successfully!');
        setShowRequestForm(false);
        setNewRequest({ itemName: '', quantity: 1, reason: '', urgency: 'normal' });
        fetchInventoryRequests(shopId);
      } else {
        alert('Failed to submit request');
      }
    } catch (error) {
      console.error('Error submitting request:', error);
      alert('Error submitting request');
    }
  };

  return (
    <div style={{minHeight:'100vh', background:'linear-gradient(135deg, #3d3d3d 0%, #4a4a4a 50%, #525252 100%)'}}>
      {/* Header */}
      <div style={{background:'rgba(0,0,0,0.3)', borderBottom:'1px solid rgba(229,51,42,0.3)', padding:'16px 32px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <div style={{display:'flex', alignItems:'center', gap:24}}>
          <Link href="/" style={{fontSize:24, fontWeight:900, color:'#e5332a', textDecoration:'none'}}>SOS</Link>
          <div>
            <div style={{fontSize:20, fontWeight:700, color:'#e5e7eb'}} suppressHydrationWarning>{shopName || 'Loading...'}</div>
            <div style={{fontSize:12, color:'#9aa3b2'}}>Manager Dashboard</div>
          </div>
        </div>
        <div style={{display:'flex', alignItems:'center', gap:16}}>
          <span style={{fontSize:14, color:'#9aa3b2'}} suppressHydrationWarning>Welcome, {userName}</span>
          <button onClick={handleSignOut} style={{padding:'8px 16px', background:'#e5332a', color:'white', border:'none', borderRadius:6, cursor:'pointer', fontSize:13, fontWeight:600}}>
            Sign Out
          </button>
        </div>
      </div>

      <div style={{maxWidth:1400, margin:'0 auto', padding:32}}>
        <div style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap:24}}>
          {/* Left Column */}
          <div style={{display:'grid', gap:24}}>
            {/* Inventory Requests */}
            <div style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:24}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20}}>
                <h2 style={{fontSize:20, fontWeight:700, color:'#e5e7eb'}}>📦 Inventory Requests</h2>
                <button
                  onClick={() => setShowRequestForm(!showRequestForm)}
                  style={{
                    padding:'8px 16px',
                    background:'#3b82f6',
                    color:'white',
                    border:'none',
                    borderRadius:6,
                    cursor:'pointer',
                    fontSize:13,
                    fontWeight:600,
                  }}
                >
                  + New Request
                </button>
              </div>

              {showRequestForm && (
                <div style={{background:'rgba(59,130,246,0.1)', border:'1px solid rgba(59,130,246,0.3)', borderRadius:8, padding:16, marginBottom:16}}>
                  <h3 style={{color:'#e5e7eb', marginBottom:12, fontSize:16}}>Request Inventory Item</h3>
                  <div style={{display:'grid', gap:12}}>
                    <input
                      type="text"
                      placeholder="Item name"
                      value={newRequest.itemName}
                      onChange={(e) => setNewRequest({...newRequest, itemName: e.target.value})}
                      style={{padding:10, borderRadius:6, border:'1px solid rgba(255,255,255,0.2)', background:'rgba(0,0,0,0.3)', color:'white'}}
                    />
                    <input
                      type="number"
                      placeholder="Quantity"
                      value={newRequest.quantity}
                      onChange={(e) => setNewRequest({...newRequest, quantity: parseInt(e.target.value)})}
                      style={{padding:10, borderRadius:6, border:'1px solid rgba(255,255,255,0.2)', background:'rgba(0,0,0,0.3)', color:'white'}}
                    />
                    <select
                      value={newRequest.urgency}
                      onChange={(e) => setNewRequest({...newRequest, urgency: e.target.value})}
                      style={{padding:10, borderRadius:6, border:'1px solid rgba(255,255,255,0.2)', background:'rgba(0,0,0,0.3)', color:'white'}}
                    >
                      <option value="low">Low Priority</option>
                      <option value="normal">Normal</option>
                      <option value="high">High Priority</option>
                      <option value="urgent">Urgent</option>
                    </select>
                    <textarea
                      placeholder="Reason for request"
                      value={newRequest.reason}
                      onChange={(e) => setNewRequest({...newRequest, reason: e.target.value})}
                      style={{padding:10, borderRadius:6, border:'1px solid rgba(255,255,255,0.2)', background:'rgba(0,0,0,0.3)', color:'white', minHeight:60}}
                    />
                    <div style={{display:'flex', gap:8}}>
                      <button
                        onClick={handleSubmitRequest}
                        style={{flex:1, padding:10, background:'#22c55e', color:'white', border:'none', borderRadius:6, cursor:'pointer', fontWeight:600}}
                      >
                        Submit Request
                      </button>
                      <button
                        onClick={() => setShowRequestForm(false)}
                        style={{flex:1, padding:10, background:'#6b7280', color:'white', border:'none', borderRadius:6, cursor:'pointer', fontWeight:600}}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div style={{display:'grid', gap:12}}>
                {inventoryRequests.length === 0 ? (
                  <div style={{textAlign:'center', padding:32, color:'#9aa3b2'}}>
                    No inventory requests yet. Click "New Request" to submit one.
                  </div>
                ) : (
                  inventoryRequests.map((req) => (
                    <div key={req.id} style={{background:'rgba(255,255,255,0.05)', borderRadius:8, padding:16}}>
                      <div style={{display:'flex', justifyContent:'space-between', marginBottom:8}}>
                        <div style={{color:'#e5e7eb', fontWeight:600}}>{req.itemName}</div>
                        <span style={{
                          padding:'4px 12px',
                          borderRadius:12,
                          fontSize:11,
                          fontWeight:600,
                          background: req.status === 'approved' ? 'rgba(34,197,94,0.2)' : req.status === 'denied' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)',
                          color: req.status === 'approved' ? '#22c55e' : req.status === 'denied' ? '#ef4444' : '#f59e0b',
                        }}>
                          {req.status.toUpperCase()}
                        </span>
                      </div>
                      <div style={{color:'#9aa3b2', fontSize:13, marginBottom:4}}>
                        Quantity: {req.quantity} • Urgency: {req.urgency}
                      </div>
                      {req.reason && (
                        <div style={{color:'#9aa3b2', fontSize:12, marginTop:8}}>{req.reason}</div>
                      )}
                      <div style={{color:'#6b7280', fontSize:11, marginTop:8}}>
                        Requested: {new Date(req.createdAt).toLocaleString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            {/* Messaging Card */}
            <MessagingCard userId={userId} shopId={shopId} />
          </div>

          {/* Right Column - Time Clock */}
          <div>
            <TimeClock techId={userId} shopId={shopId} techName={userName} />

            {/* Quick Links */}
            <div style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:24, marginTop:24}}>
              <h3 style={{color:'#e5e7eb', marginBottom:16, fontSize:16}}>Quick Actions</h3>
              <div style={{display:'grid', gap:8}}>
                <Link href="/manager/dashboard" style={{padding:12, background:'rgba(168,85,247,0.2)', borderRadius:8, textDecoration:'none', color:'#a855f7', fontSize:14, fontWeight:700, border:'1px solid rgba(168,85,247,0.3)'}}>
                  📊 Manager Dashboard
                </Link>
                <Link href="/manager/assignments" style={{padding:12, background:'rgba(168,85,247,0.2)', borderRadius:8, textDecoration:'none', color:'#a855f7', fontSize:14, fontWeight:700, border:'1px solid rgba(168,85,247,0.3)'}}>
                  👥 Assign Work Orders
                </Link>
                <a href="/shop/home" style={{padding:12, background:'rgba(59,130,246,0.1)', borderRadius:8, textDecoration:'none', color:'#3b82f6', fontSize:14, fontWeight:600, cursor:'pointer'}}>
                  📊 View Center Control
                </a>
                <Link href="/shop/manage-team" style={{padding:12, background:'rgba(168,85,247,0.1)', borderRadius:8, textDecoration:'none', color:'#a855f7', fontSize:14, fontWeight:600}}>
                  👥 Manage Team
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
