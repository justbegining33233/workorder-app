'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRequireAuth } from '@/contexts/AuthContext';

interface TrackingOrder {
  workOrderId: string;
  issueDescription: string;
  status: string;
  tech: {
    id: string;
    name: string;
    phone: string;
  } | null;
  shop: {
    shopName: string;
    address: string;
    phone: string;
  };
  serviceTime: string;
  // location can be either a GPS object for roadside jobs or a shopAddress for in-shop jobs
  location?: {
    latitude?: number;
    longitude?: number;
    estimatedArrival?: string | null;
    shopAddress?: string | null;
  } | null;
  estimatedArrival?: string | null;
  isInShop?: boolean;
}

export default function LiveTracking() {
  useRequireAuth(['customer']);
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState('');
  const [trackingOrders, setTrackingOrders] = useState<TrackingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [messageModal, setMessageModal] = useState<{
    isOpen: boolean;
    order: TrackingOrder | null;
    message: string;
    sending: boolean;
  }>({
    isOpen: false,
    order: null,
    message: '',
    sending: false
  });

  useEffect(() => {
    const name = localStorage.getItem('userName') || '';
    const id = localStorage.getItem('userId') || '';
    setUserName(name);
    setUserId(id);
  }, []);

  useEffect(() => {
    console.log('userId changed:', userId);
    if (userId) {
      fetchTrackingData();
    } else {
      console.log('No userId, not fetching tracking data');
      setLoading(false);
    }
  }, [userId]);

  const fetchTrackingData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      console.log('Tracking page - Token present:', !!token);
      console.log('Tracking page - UserId:', userId);
      
      if (!token) {
        console.log('Tracking page - No token found, user not authenticated');
        setError('Authentication required');
        return;
      }
      
      const response = await fetch(`/api/customers/tracking?customerId=${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      console.log('Tracking page - Response status:', response.status);
      console.log('Tracking page - Response ok:', response.ok);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Tracking page - Data received:', data);
        setTrackingOrders(data);
      } else if (response.status === 404) {
        console.log('Tracking page - No active work orders');
        setError('No active work orders to track');
        setTrackingOrders([]);
      } else {
        const errorText = await response.text();
        console.log('Tracking page - Error response:', errorText);
        setError('Failed to load tracking data');
      }
    } catch (err) {
      console.log('Tracking page - Fetch error:', err);
      setError('Failed to load tracking data');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    window.location.href = '/auth/login';
  };

  const openMessageModal = (order: TrackingOrder) => {
    setMessageModal({
      isOpen: true,
      order,
      message: '',
      sending: false
    });
  };

  const closeMessageModal = () => {
    setMessageModal({
      isOpen: false,
      order: null,
      message: '',
      sending: false
    });
  };

  const sendMessage = async () => {
    if (!messageModal.order || !messageModal.message.trim()) return;

    setMessageModal(prev => ({ ...prev, sending: true }));

    try {
      const token = localStorage.getItem('token');
      const recipientType = messageModal.order.isInShop ? 'shop' : 'technician';
      const response = await fetch('/api/customers/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          workOrderId: messageModal.order.workOrderId,
          message: messageModal.message.trim(),
          recipientType,
        }),
      });

      if (response.ok) {
        alert('Message sent successfully!');
        closeMessageModal();
      } else {
        alert('Failed to send message. Please try again.');
      }
    } catch (error) {
      alert('Failed to send message. Please try again.');
    } finally {
      setMessageModal(prev => ({ ...prev, sending: false }));
    }
  };

  return (
    <div style={{minHeight:'100vh', background:'linear-gradient(135deg, #3d3d3d 0%, #4a4a4a 50%, #525252 100%)'}}>
      {/* Header */}
      <div style={{background:'rgba(0,0,0,0.3)', borderBottom:'1px solid rgba(229,51,42,0.3)', padding:'16px 32px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <div style={{display:'flex', alignItems:'center', gap:24}}>
          <Link href="/customer/dashboard" style={{fontSize:24, fontWeight:900, color:'#e5332a', textDecoration:'none'}}>FixTray</Link>
          <div>
            <div style={{fontSize:20, fontWeight:700, color:'#e5e7eb'}}>Customer Portal</div>
            <div style={{fontSize:12, color:'#9aa3b2'}}>Live Tracking</div>
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
        <h1 style={{fontSize:32, fontWeight:700, color:'#e5e7eb', marginBottom:32}}>Live Tracking</h1>

        {loading && (
          <div style={{textAlign:'center', padding:40, color:'#9aa3b2'}}>
            Loading tracking data...
          </div>
        )}

        {error && (
          <div style={{textAlign:'center', padding:40, color:'#ef4444'}}>
            {error}
          </div>
        )}

        {!loading && !error && (
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(400px, 1fr))', gap:24}}>
            {trackingOrders.map(order => (
              <div key={order.workOrderId} style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:24}}>
                <div style={{marginBottom:20}}>
                  <h3 style={{fontSize:20, fontWeight:700, color:'#e5e7eb', marginBottom:8}}>{order.issueDescription}</h3>
                  <div style={{fontSize:14, color:'#9aa3b2', marginBottom:4}}>Work Order • {order.workOrderId}</div>
                  <div style={{fontSize:16, color:'#3b82f6', fontWeight:600, marginBottom:12}}>{order.status}</div>

                  {order.tech && (
                    <div style={{fontSize:14, color:'#9aa3b2', marginBottom:4}}>
                      👨‍🔧 {order.tech.name}
                    </div>
                  )}

                  <div style={{fontSize:14, color:'#9aa3b2', marginBottom:4}}>
                    🏪 {order.shop.shopName}
                  </div>

                  {order.isInShop || order.location?.shopAddress ? (
                    <div style={{display:'flex', flexDirection:'column', gap:6}}>
                      <div style={{fontSize:14, color:'#9aa3b2'}}>
                        📍 {order.shop.address || order.location?.shopAddress}
                      </div>
                      <div style={{fontSize:14, color:'#f59e0b', fontWeight:600}}>
                        🕒 Service Time: {order.serviceTime ? new Date(order.serviceTime).toLocaleString() : (order.estimatedArrival ? new Date(order.estimatedArrival).toLocaleString() : '')}
                      </div>
                    </div>
                  ) : (
                    <div style={{display:'flex', flexDirection:'column', gap:6}}>
                      {order.location && order.location.latitude !== undefined && order.location.longitude !== undefined ? (
                        <div style={{display:'flex', gap:12, alignItems:'center'}}>
                          <div style={{fontSize:14, color:'#e5e7eb'}}>📍 Current Location: {order.location.latitude!.toFixed(4)}, {order.location.longitude!.toFixed(4)}</div>
                          {order.location.estimatedArrival && <div style={{fontSize:14, color:'#f59e0b'}}>⏰ ETA: {new Date(order.location.estimatedArrival).toLocaleTimeString()}</div>}
                        </div>
                      ) : (
                        <div style={{fontSize:14, color:'#9aa3b2'}}>Live tracking not available for this job yet.</div>
                      )}
                    </div>
                  )}
                </div>
                <div style={{display:'flex', gap:12}}>
                  <Link href={`/customer/workorders/${order.workOrderId}`} style={{
                    flex:1,
                    padding:'12px',
                    background:'#3b82f6',
                    color:'white',
                    border:'none',
                    borderRadius:8,
                    fontSize:14,
                    fontWeight:600,
                    textDecoration:'none',
                    textAlign:'center',
                    display:'inline-block'
                  }}>
                    View Details
                  </Link>
                  <div style={{display:'flex', flex:1, gap:6}}>
                    {order.tech?.phone && (
                      <a href={`tel:${order.tech.phone}`} style={{
                        flex:1,
                        padding:'12px',
                        background:'rgba(34,197,94,0.1)',
                        color:'#22c55e',
                        border:'1px solid rgba(34,197,94,0.3)',
                        borderRadius:8,
                        fontSize:12,
                        fontWeight:600,
                        textDecoration:'none',
                        textAlign:'center'
                      }}>
                        📞 Call
                      </a>
                    )}
                    <button onClick={() => openMessageModal(order)} style={{
                      flex:1,
                      padding:'12px',
                      background:'rgba(168,85,247,0.1)',
                      color:'#a855f7',
                      border:'1px solid rgba(168,85,247,0.3)',
                      borderRadius:8,
                      fontSize:12,
                      fontWeight:600,
                      cursor:'pointer'
                    }}>
                      💬 Message
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && !error && trackingOrders.length === 0 && (
          <div style={{textAlign:'center', padding:40, color:'#9aa3b2'}}>
            No active orders to track.
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

      {/* Message Modal */}
      {messageModal.isOpen && messageModal.order && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'rgba(0,0,0,0.9)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 12,
            padding: 24,
            maxWidth: 500,
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h3 style={{fontSize: 20, fontWeight: 700, color: '#e5e7eb', marginBottom: 16}}>
              {messageModal.order.isInShop ? 'Message Shop' : 'Message Technician'}
            </h3>
            <div style={{fontSize: 14, color: '#9aa3b2', marginBottom: 16}}>
              Work Order: {messageModal.order.workOrderId}
              {messageModal.order.isInShop ? (
                <div>Shop: {messageModal.order.shop.shopName}</div>
              ) : (
                messageModal.order.tech && <div>Technician: {messageModal.order.tech.name}</div>
              )}
            </div>
            <textarea
              value={messageModal.message}
              onChange={(e) => setMessageModal(prev => ({ ...prev, message: e.target.value }))}
              placeholder="Type your message here..."
              style={{
                width: '100%',
                minHeight: 120,
                padding: 12,
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 8,
                color: '#e5e7eb',
                fontSize: 14,
                resize: 'vertical',
                marginBottom: 16
              }}
            />
            <div style={{display: 'flex', gap: 12, justifyContent: 'flex-end'}}>
              <button
                onClick={closeMessageModal}
                style={{
                  padding: '8px 16px',
                  background: 'transparent',
                  color: '#9aa3b2',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 14
                }}
              >
                Cancel
              </button>
              <button
                onClick={sendMessage}
                disabled={!messageModal.message.trim() || messageModal.sending}
                style={{
                  padding: '8px 16px',
                  background: '#a855f7',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  cursor: messageModal.message.trim() && !messageModal.sending ? 'pointer' : 'not-allowed',
                  fontSize: 14,
                  fontWeight: 600,
                  opacity: messageModal.message.trim() && !messageModal.sending ? 1 : 0.5
                }}
              >
                {messageModal.sending ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}