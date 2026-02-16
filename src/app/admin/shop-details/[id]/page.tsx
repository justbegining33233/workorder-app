'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useRequireAuth } from '@/contexts/AuthContext';

type ShopDetails = {
  id: string;
  shopName: string;
  ownerName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  shopType: string;
  status: string;
  businessLicense: string;
  insurancePolicy: string;
  profileComplete: boolean;
  createdAt: string;
  approvedAt: string | null;
  subscription: {
    plan: string;
    status: string;
    currentPeriodEnd: string | null;
  } | null;
  stats: {
    totalWorkOrders: number;
    completedWorkOrders: number;
    totalRevenue: number;
    technicians: number;
    customers: number;
    avgRating: number;
  };
};

export default function ShopDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading } = useRequireAuth(['admin']);
  const [shop, setShop] = useState<ShopDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  
  const shopId = params?.id as string;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('token');
      setToken(storedToken);
    }
  }, []);

  useEffect(() => {
    if (isLoading || !user || !shopId || !token) return;

    const fetchShopDetails = async () => {
      try {
        const headers: Record<string, string> = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        const res = await fetch(`/api/admin/shops/${shopId}`, {
          credentials: 'include',
          headers
        });
        
        if (!res.ok) {
          if (res.status === 404) {
            setError('Shop not found');
          } else if (res.status === 401) {
            setError('Session expired. Please log in again.');
            router.push('/auth/login');
          } else {
            setError('Failed to load shop details');
          }
          setLoading(false);
          return;
        }
        
        const data = await res.json();
        setShop(data);
      } catch (err) {
        console.error('Error fetching shop:', err);
        setError('Failed to load shop details');
      } finally {
        setLoading(false);
      }
    };

    fetchShopDetails();
  }, [isLoading, user, shopId, token, router]);

  const handleStatusChange = async (newStatus: string) => {
    if (!shop) return;
    
    const action = newStatus === 'suspended' ? 'suspend' : newStatus === 'approved' ? 'approve' : 'update';
    if (!confirm(`Are you sure you want to ${action} this shop?`)) return;
    
    setActionLoading(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const res = await fetch(`/api/admin/shops/${shop.id}/status`, {
        method: 'PATCH',
        credentials: 'include',
        headers,
        body: JSON.stringify({ status: newStatus })
      });
      
      if (res.ok) {
        setShop(prev => prev ? { ...prev, status: newStatus } : null);
        alert(`Shop has been ${action === 'suspend' ? 'suspended' : action === 'approve' ? 'approved' : 'updated'}.`);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update shop status');
      }
    } catch (err) {
      console.error('Error updating shop status:', err);
      alert('Failed to update shop status');
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #3d3d3d 0%, #4a4a4a 50%, #525252 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e5e7eb' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
          <div>Loading shop details...</div>
        </div>
      </div>
    );
  }

  if (error || !shop) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #3d3d3d 0%, #4a4a4a 50%, #525252 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e5e7eb' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
          <div style={{ fontSize: 20, marginBottom: 16 }}>{error || 'Shop not found'}</div>
          <Link href="/admin/manage-customers" style={{ color: '#3b82f6', textDecoration: 'none' }}>
            ← Back to Manage Customers
          </Link>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return '#22c55e';
      case 'pending': return '#f59e0b';
      case 'suspended': return '#e5332a';
      default: return '#9aa3b2';
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #3d3d3d 0%, #4a4a4a 50%, #525252 100%)' }}>
      {/* Header */}
      <div style={{ background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid rgba(34,197,94,0.3)', padding: '20px 32px' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <Link href="/admin/manage-customers" style={{ color: '#3b82f6', textDecoration: 'none', fontSize: 14, fontWeight: 600, marginBottom: 16, display: 'inline-block' }}>
            ← Back to Manage Customers
          </Link>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
                <h1 style={{ fontSize: 28, fontWeight: 700, color: '#e5e7eb' }}>{shop.shopName}</h1>
                <span style={{ padding: '6px 16px', background: `${getStatusColor(shop.status)}20`, color: getStatusColor(shop.status), borderRadius: 8, fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>
                  {shop.status}
                </span>
              </div>
              <p style={{ fontSize: 14, color: '#9aa3b2' }}>Owner: {shop.ownerName || 'N/A'} • {shop.shopType || 'Auto'} Shop</p>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              {shop.status === 'approved' && (
                <button
                  onClick={() => handleStatusChange('suspended')}
                  disabled={actionLoading}
                  style={{ padding: '10px 20px', background: 'rgba(229,51,42,0.2)', color: '#e5332a', border: '1px solid rgba(229,51,42,0.3)', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: actionLoading ? 'not-allowed' : 'pointer', opacity: actionLoading ? 0.6 : 1 }}
                >
                  {actionLoading ? 'Processing...' : 'Suspend Shop'}
                </button>
              )}
              {shop.status === 'suspended' && (
                <button
                  onClick={() => handleStatusChange('approved')}
                  disabled={actionLoading}
                  style={{ padding: '10px 20px', background: 'rgba(34,197,94,0.2)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: actionLoading ? 'not-allowed' : 'pointer', opacity: actionLoading ? 0.6 : 1 }}
                >
                  {actionLoading ? 'Processing...' : 'Reactivate Shop'}
                </button>
              )}
              {shop.status === 'pending' && (
                <button
                  onClick={() => handleStatusChange('approved')}
                  disabled={actionLoading}
                  style={{ padding: '10px 20px', background: 'rgba(34,197,94,0.2)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: actionLoading ? 'not-allowed' : 'pointer', opacity: actionLoading ? 0.6 : 1 }}
                >
                  {actionLoading ? 'Processing...' : 'Approve Shop'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: 32 }}>
        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
          <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 12, color: '#9aa3b2', marginBottom: 8 }}>Total Work Orders</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#3b82f6' }}>{shop.stats.totalWorkOrders}</div>
          </div>
          <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 12, color: '#9aa3b2', marginBottom: 8 }}>Completed Jobs</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#22c55e' }}>{shop.stats.completedWorkOrders}</div>
          </div>
          <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 12, color: '#9aa3b2', marginBottom: 8 }}>Total Revenue</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#22c55e' }}>${shop.stats.totalRevenue.toLocaleString()}</div>
          </div>
          <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(249,115,22,0.3)', borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 12, color: '#9aa3b2', marginBottom: 8 }}>Technicians</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#f97316' }}>{shop.stats.technicians}</div>
          </div>
          <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(168,85,247,0.3)', borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 12, color: '#9aa3b2', marginBottom: 8 }}>Customers</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#a855f7' }}>{shop.stats.customers}</div>
          </div>
          <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 12, color: '#9aa3b2', marginBottom: 8 }}>Avg Rating</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#fbbf24' }}>⭐ {shop.stats.avgRating.toFixed(1)}</div>
          </div>
        </div>

        {/* Details Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24 }}>
          {/* Contact Information */}
          <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#e5e7eb', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              📞 Contact Information
            </h3>
            <div style={{ display: 'grid', gap: 16 }}>
              <div>
                <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4, textTransform: 'uppercase' }}>Email</div>
                <div style={{ fontSize: 14, color: '#e5e7eb' }}>{shop.email}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4, textTransform: 'uppercase' }}>Phone</div>
                <div style={{ fontSize: 14, color: '#e5e7eb' }}>{shop.phone}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4, textTransform: 'uppercase' }}>Address</div>
                <div style={{ fontSize: 14, color: '#e5e7eb' }}>
                  {shop.address || 'N/A'}<br />
                  {shop.city}, {shop.state} {shop.zipCode}
                </div>
              </div>
            </div>
          </div>

          {/* Business Information */}
          <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#e5e7eb', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              🏢 Business Information
            </h3>
            <div style={{ display: 'grid', gap: 16 }}>
              <div>
                <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4, textTransform: 'uppercase' }}>Shop Type</div>
                <div style={{ fontSize: 14, color: '#e5e7eb', textTransform: 'capitalize' }}>{shop.shopType || 'Auto'}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4, textTransform: 'uppercase' }}>Business License</div>
                <div style={{ fontSize: 14, color: '#e5e7eb' }}>{shop.businessLicense || 'Not provided'}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4, textTransform: 'uppercase' }}>Insurance Policy</div>
                <div style={{ fontSize: 14, color: '#e5e7eb' }}>{shop.insurancePolicy || 'Not provided'}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4, textTransform: 'uppercase' }}>Profile Complete</div>
                <div style={{ fontSize: 14, color: shop.profileComplete ? '#22c55e' : '#f59e0b' }}>
                  {shop.profileComplete ? '✓ Complete' : '⚠ Incomplete'}
                </div>
              </div>
            </div>
          </div>

          {/* Subscription Information */}
          <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#e5e7eb', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              💳 Subscription
            </h3>
            {shop.subscription ? (
              <div style={{ display: 'grid', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4, textTransform: 'uppercase' }}>Plan</div>
                  <div style={{ fontSize: 14, color: '#f97316', fontWeight: 600, textTransform: 'capitalize' }}>{shop.subscription.plan}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4, textTransform: 'uppercase' }}>Status</div>
                  <div style={{ fontSize: 14, color: shop.subscription.status === 'active' ? '#22c55e' : '#f59e0b', textTransform: 'capitalize' }}>{shop.subscription.status}</div>
                </div>
                {shop.subscription.currentPeriodEnd && (
                  <div>
                    <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4, textTransform: 'uppercase' }}>Renews On</div>
                    <div style={{ fontSize: 14, color: '#e5e7eb' }}>{new Date(shop.subscription.currentPeriodEnd).toLocaleDateString()}</div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ color: '#9aa3b2', fontSize: 14 }}>No active subscription</div>
            )}
          </div>

          {/* Account Dates */}
          <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#e5e7eb', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              📅 Account Timeline
            </h3>
            <div style={{ display: 'grid', gap: 16 }}>
              <div>
                <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4, textTransform: 'uppercase' }}>Created</div>
                <div style={{ fontSize: 14, color: '#e5e7eb' }}>{new Date(shop.createdAt).toLocaleDateString()} at {new Date(shop.createdAt).toLocaleTimeString()}</div>
              </div>
              {shop.approvedAt && (
                <div>
                  <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4, textTransform: 'uppercase' }}>Approved</div>
                  <div style={{ fontSize: 14, color: '#22c55e' }}>{new Date(shop.approvedAt).toLocaleDateString()} at {new Date(shop.approvedAt).toLocaleTimeString()}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
