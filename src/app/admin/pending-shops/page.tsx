'use client';

import { useEffect, useState, startTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useRequireAuth } from '@/contexts/AuthContext';

type PendingShop = {
  id: string;
  name: string;
  location: string;
  address: string;
  phone: string;
  email: string;
  services: number;
  submitted: Date;
  status: string;
  shopName: string;
  ownerName: string;
  businessLicense: string;
  insurancePolicy: string;
};

export default function PendingShops() {
  const router = useRouter();
  const { user, isLoading } = useRequireAuth(['admin']);
  const [mounted, setMounted] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [previousPendingCount, setPreviousPendingCount] = useState(0);
  const [pendingShops, setPendingShops] = useState<PendingShop[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedShop, setSelectedShop] = useState<PendingShop | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [shopToApprove, setShopToApprove] = useState<PendingShop | null>(null);
  const [approving, setApproving] = useState(false);

  // All hooks must be called before any conditional returns
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || isLoading || !user) return;
    
    fetchPendingShops();
    
    // Request notification permission
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          setNotificationPermission(permission);
        });
      }
    }
  }, [mounted, isLoading, user]);

  // Auto-refresh pending shops every 5 seconds
  useEffect(() => {
    if (!mounted || isLoading || !user) return;

    let refreshTimeout: NodeJS.Timeout;
    
    const refreshPendingShops = async () => {
      try {
        const response = await fetch('/api/shops/pending', {
          cache: 'no-store',
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          
          // Check for new shops and send notification
          if (data.length > previousPendingCount && previousPendingCount > 0) {
            const newCount = data.length - previousPendingCount;
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

              setTimeout(() => notification.close(), 5000);
            }
          }
          
          startTransition(() => {
            setPendingShops(data);
            setPreviousPendingCount(data.length);
          });
        }
      } catch (error) {
        console.error('Error refreshing pending shops:', error);
      }
    };

    // Set up interval for auto-refresh with a slight delay to prevent glitches
    const interval = setInterval(() => {
      refreshTimeout = setTimeout(refreshPendingShops, 100); // Small delay
    }, 5000);

    return () => {
      clearInterval(interval);
      if (refreshTimeout) clearTimeout(refreshTimeout);
    };
  }, [mounted, previousPendingCount, notificationPermission, isLoading, user]);

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

  const fetchPendingShops = async () => {
    try {
      const response = await fetch('/api/shops/pending', {
        cache: 'no-store',
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setPendingShops(data);
      }
    } catch (error) {
      console.error('Error fetching pending shops:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveClick = (shop: PendingShop) => {
    setShopToApprove(shop);
    setShowApproveConfirm(true);
  };

  const handleApprove = async () => {
    if (!shopToApprove) return;
    
    setApproving(true);
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/shops/pending', {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id: shopToApprove.id, action: 'approve' }),
      });

      if (response.ok) {
        // Show success message
        alert(`✅ ${shopToApprove.shopName} has been approved!\n\nThe shop will now be able to:\n• Log in to their account\n• Complete their profile (business license, insurance, services)\n• Access their dashboard\n• Receive work orders`);
        fetchPendingShops();
        setShowDetails(false);
        setShowApproveConfirm(false);
        setShopToApprove(null);
      } else {
        alert('Failed to approve shop. Please try again.');
      }
    } catch (error) {
      console.error('Error approving shop:', error);
      alert('Failed to approve shop. Please try again.');
    } finally {
      setApproving(false);
    }
  };

  const handleDeny = async (shopId: string) => {
    if (!confirm('Are you sure you want to deny this shop application?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/shops/pending', {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id: shopId, action: 'deny' }),
      });

      if (response.ok) {
        alert('Shop application denied');
        fetchPendingShops();
        setShowDetails(false);
      }
    } catch (error) {
      console.error('Error denying shop:', error);
      alert('Failed to deny shop');
    }
  };

  const handleReviewDetails = (shop: PendingShop) => {
    setSelectedShop(shop);
    setShowDetails(true);
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

  return (
    <div style={{minHeight:'100vh', background:'linear-gradient(135deg, #3d3d3d 0%, #4a4a4a 50%, #525252 100%)'}}>
      {/* Header */}
      <div style={{background:'rgba(0,0,0,0.3)', borderBottom:'1px solid rgba(229,51,42,0.3)', padding:'20px 32px'}}>
        <div style={{maxWidth:1400, margin:'0 auto'}}>
          <Link href="/admin/home" style={{color:'#3b82f6', textDecoration:'none', fontSize:14, fontWeight:600, marginBottom:16, display:'inline-block'}}>
            ← Back to Dashboard
          </Link>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <div>
              <h1 style={{fontSize:28, fontWeight:700, color:'#e5e7eb', marginBottom:8}}>Pending Shop Approvals</h1>
              <p style={{fontSize:14, color:'#9aa3b2'}}>Review and approve new shop applications</p>
            </div>
            <div style={{padding:'8px 16px', background:'rgba(229,51,42,0.2)', color:'#e5332a', borderRadius:8, fontSize:14, fontWeight:700}}>
              {pendingShops.length} Pending
            </div>
          </div>
        </div>
      </div>

      <div style={{maxWidth:1400, margin:'0 auto', padding:32}}>
        {loading ? (
          <div style={{textAlign:'center', padding:80, color:'#9aa3b2', fontSize:16}}>Loading...</div>
        ) : pendingShops.length === 0 ? (
          <div style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:80, textAlign:'center'}}>
            <div style={{fontSize:48, marginBottom:16}}>✓</div>
            <div style={{fontSize:20, fontWeight:700, color:'#e5e7eb', marginBottom:8}}>No Pending Applications</div>
            <div style={{fontSize:14, color:'#9aa3b2'}}>All shop applications have been reviewed</div>
          </div>
        ) : (
          <div style={{display:'grid', gap:16}}>
            {pendingShops.map((shop) => (
              <div key={shop.id} style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(229,51,42,0.3)', borderRadius:12, padding:24, transition: 'all 0.3s ease'}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20}}>
                  <div style={{flex:1}}>
                    <div style={{display:'flex', alignItems:'center', gap:12, marginBottom:8}}>
                      <h2 style={{fontSize:20, fontWeight:700, color:'#e5e7eb'}}>{shop.name}</h2>
                      <span style={{padding:'4px 12px', background:'rgba(245,158,11,0.2)', color:'#f59e0b', borderRadius:8, fontSize:11, fontWeight:600}}>
                        PENDING
                      </span>
                    </div>
                    <div style={{fontSize:14, color:'#9aa3b2', marginBottom:4}}>
                      📍 {shop.location}
                    </div>
                    <div style={{fontSize:13, color:'#6b7280'}}>
                      {shop.services} services • Submitted {getTimeAgo(shop.submitted)}
                    </div>
                  </div>
                </div>

                <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:12, marginBottom:20, padding:16, background:'rgba(255,255,255,0.05)', borderRadius:8}}>
                  <div>
                    <div style={{fontSize:11, color:'#6b7280', marginBottom:4}}>Owner Name</div>
                    <div style={{fontSize:14, color:'#e5e7eb', fontWeight:600}}>{shop.ownerName}</div>
                  </div>
                  <div>
                    <div style={{fontSize:11, color:'#6b7280', marginBottom:4}}>Email</div>
                    <div style={{fontSize:14, color:'#e5e7eb', fontWeight:600}}>{shop.email}</div>
                  </div>
                  <div>
                    <div style={{fontSize:11, color:'#6b7280', marginBottom:4}}>Phone</div>
                    <div style={{fontSize:14, color:'#e5e7eb', fontWeight:600}}>{shop.phone}</div>
                  </div>
                  <div>
                    <div style={{fontSize:11, color:'#6b7280', marginBottom:4}}>Business License</div>
                    <div style={{fontSize:14, color:'#e5e7eb', fontWeight:600}}>{shop.businessLicense}</div>
                  </div>
                </div>

                <div style={{display:'flex', gap:12}}>
                  <button 
                    onClick={() => handleApproveClick(shop)}
                    style={{flex:1, padding:'12px', background:'#22c55e', color:'white', border:'none', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer'}}
                  >
                    ✓ Approve Shop
                  </button>
                  <button 
                    onClick={() => handleReviewDetails(shop)}
                    style={{flex:1, padding:'12px', background:'rgba(59,130,246,0.2)', color:'#3b82f6', border:'1px solid rgba(59,130,246,0.3)', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer'}}
                  >
                    Review Details
                  </button>
                  <button 
                    onClick={() => handleDeny(shop.id)}
                    style={{padding:'12px 24px', background:'rgba(229,51,42,0.2)', color:'#e5332a', border:'1px solid rgba(229,51,42,0.3)', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer'}}
                  >
                    ✕ Deny
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetails && selectedShop && (
        <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.8)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:32}}>
          <div style={{background:'linear-gradient(135deg, #3d3d3d 0%, #4a4a4a 50%, #525252 100%)', border:'2px solid rgba(229,51,42,0.3)', borderRadius:16, padding:32, maxWidth:800, width:'100%', maxHeight:'90vh', overflowY:'auto'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24}}>
              <h2 style={{fontSize:24, fontWeight:700, color:'#e5e7eb'}}>Shop Application Details</h2>
              <button 
                onClick={() => setShowDetails(false)}
                style={{padding:'8px 16px', background:'rgba(255,255,255,0.1)', color:'#e5e7eb', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer'}}
              >
                ✕ Close
              </button>
            </div>

            <div style={{display:'flex', flexDirection:'column', gap:20}}>
              <div>
                <h3 style={{fontSize:18, fontWeight:700, color:'#e5e7eb', marginBottom:12}}>Business Information</h3>
                <div style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:16}}>
                  <div style={{marginBottom:12}}>
                    <div style={{fontSize:11, color:'#6b7280', marginBottom:4}}>Shop Name</div>
                    <div style={{fontSize:16, color:'#e5e7eb', fontWeight:600}}>{selectedShop.shopName}</div>
                  </div>
                  <div style={{marginBottom:12}}>
                    <div style={{fontSize:11, color:'#6b7280', marginBottom:4}}>Owner Name</div>
                    <div style={{fontSize:16, color:'#e5e7eb', fontWeight:600}}>{selectedShop.ownerName}</div>
                  </div>
                  <div style={{marginBottom:12}}>
                    <div style={{fontSize:11, color:'#6b7280', marginBottom:4}}>Full Address</div>
                    <div style={{fontSize:16, color:'#e5e7eb', fontWeight:600}}>{selectedShop.address}</div>
                  </div>
                  <div style={{marginBottom:12}}>
                    <div style={{fontSize:11, color:'#6b7280', marginBottom:4}}>Business License #</div>
                    <div style={{fontSize:16, color:'#e5e7eb', fontWeight:600}}>{selectedShop.businessLicense}</div>
                  </div>
                  <div>
                    <div style={{fontSize:11, color:'#6b7280', marginBottom:4}}>Insurance Policy #</div>
                    <div style={{fontSize:16, color:'#e5e7eb', fontWeight:600}}>{selectedShop.insurancePolicy}</div>
                  </div>
                </div>
              </div>

              <div>
                <h3 style={{fontSize:18, fontWeight:700, color:'#e5e7eb', marginBottom:12}}>Contact Information</h3>
                <div style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:16}}>
                  <div style={{marginBottom:12}}>
                    <div style={{fontSize:11, color:'#6b7280', marginBottom:4}}>Email</div>
                    <div style={{fontSize:16, color:'#e5e7eb', fontWeight:600}}>{selectedShop.email}</div>
                  </div>
                  <div>
                    <div style={{fontSize:11, color:'#6b7280', marginBottom:4}}>Phone</div>
                    <div style={{fontSize:16, color:'#e5e7eb', fontWeight:600}}>{selectedShop.phone}</div>
                  </div>
                </div>
              </div>

              <div>
                <h3 style={{fontSize:18, fontWeight:700, color:'#e5e7eb', marginBottom:12}}>Application Details</h3>
                <div style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:16}}>
                  <div style={{marginBottom:12}}>
                    <div style={{fontSize:11, color:'#6b7280', marginBottom:4}}>Services Offered</div>
                    <div style={{fontSize:16, color:'#e5e7eb', fontWeight:600}}>{selectedShop.services} services</div>
                  </div>
                  <div>
                    <div style={{fontSize:11, color:'#6b7280', marginBottom:4}}>Submitted</div>
                    <div style={{fontSize:16, color:'#e5e7eb', fontWeight:600}}>
                      {new Date(selectedShop.submitted).toLocaleString()} ({getTimeAgo(selectedShop.submitted)})
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{display:'flex', gap:12, marginTop:24, paddingTop:24, borderTop:'1px solid rgba(255,255,255,0.1)'}}>
              <button 
                onClick={() => handleApproveClick(selectedShop)}
                style={{flex:1, padding:'14px', background:'#22c55e', color:'white', border:'none', borderRadius:8, fontSize:15, fontWeight:600, cursor:'pointer'}}
              >
                ✓ Approve This Shop
              </button>
              <button 
                onClick={() => handleDeny(selectedShop.id)}
                style={{padding:'14px 32px', background:'rgba(229,51,42,0.2)', color:'#e5332a', border:'1px solid rgba(229,51,42,0.3)', borderRadius:8, fontSize:15, fontWeight:600, cursor:'pointer'}}
              >
                ✕ Deny Application
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve Confirmation Modal */}
      {showApproveConfirm && shopToApprove && (
        <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1100, padding:32}}>
          <div style={{background:'linear-gradient(135deg, #3d3d3d 0%, #4a4a4a 50%, #525252 100%)', border:'2px solid rgba(34,197,94,0.5)', borderRadius:16, padding:32, maxWidth:600, width:'100%'}}>
            <div style={{textAlign:'center', marginBottom:24}}>
              <div style={{fontSize:48, marginBottom:16}}>✓</div>
              <h2 style={{fontSize:24, fontWeight:700, color:'#e5e7eb', marginBottom:8}}>Approve Shop Application?</h2>
              <p style={{fontSize:14, color:'#9aa3b2'}}>You are about to approve the following shop:</p>
            </div>

            <div style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(34,197,94,0.3)', borderRadius:12, padding:20, marginBottom:24}}>
              <div style={{marginBottom:12}}>
                <div style={{fontSize:11, color:'#6b7280', marginBottom:4}}>Shop Name</div>
                <div style={{fontSize:18, color:'#e5e7eb', fontWeight:700}}>{shopToApprove.shopName}</div>
              </div>
              <div style={{marginBottom:12}}>
                <div style={{fontSize:11, color:'#6b7280', marginBottom:4}}>Owner</div>
                <div style={{fontSize:16, color:'#e5e7eb', fontWeight:600}}>{shopToApprove.ownerName}</div>
              </div>
              <div style={{marginBottom:12}}>
                <div style={{fontSize:11, color:'#6b7280', marginBottom:4}}>Location</div>
                <div style={{fontSize:16, color:'#e5e7eb', fontWeight:600}}>{shopToApprove.location}</div>
              </div>
              <div>
                <div style={{fontSize:11, color:'#6b7280', marginBottom:4}}>Contact</div>
                <div style={{fontSize:14, color:'#e5e7eb'}}>{shopToApprove.email} • {shopToApprove.phone}</div>
              </div>
            </div>

            <div style={{background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.3)', borderRadius:8, padding:16, marginBottom:24}}>
              <div style={{fontSize:13, color:'#22c55e', fontWeight:600, marginBottom:8}}>✓ Upon approval, the shop will:</div>
              <ul style={{margin:0, paddingLeft:20, color:'#9aa3b2', fontSize:13, lineHeight:1.8}}>
                <li>Receive login access to their account</li>
                <li>Be redirected to complete their profile (business license, insurance, services)</li>
                <li>Access their dashboard and start receiving work orders</li>
                <li>Appear in the accepted shops list</li>
              </ul>
            </div>

            <div style={{display:'flex', gap:12}}>
              <button 
                onClick={handleApprove}
                disabled={approving}
                style={{
                  flex:1, 
                  padding:'14px', 
                  background: approving ? '#16a34a' : '#22c55e', 
                  color:'white', 
                  border:'none', 
                  borderRadius:8, 
                  fontSize:15, 
                  fontWeight:700, 
                  cursor: approving ? 'not-allowed' : 'pointer',
                  opacity: approving ? 0.7 : 1
                }}
              >
                {approving ? 'Approving...' : '✓ Yes, Approve Shop'}
              </button>
              <button 
                onClick={() => {
                  setShowApproveConfirm(false);
                  setShopToApprove(null);
                }}
                disabled={approving}
                style={{
                  padding:'14px 32px', 
                  background:'rgba(255,255,255,0.1)', 
                  color:'#e5e7eb', 
                  border:'1px solid rgba(255,255,255,0.2)', 
                  borderRadius:8, 
                  fontSize:15, 
                  fontWeight:600, 
                  cursor: approving ? 'not-allowed' : 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
