'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useRequireAuth } from '@/contexts/AuthContext';

export default function CouponManagementPage() {
  const { user, isLoading: authLoading } = useRequireAuth(['admin']);
  const router = useRouter();
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [newCoupon, setNewCoupon] = useState({
    id: '',
    name: '',
    percentOff: '',
    amountOff: '',
    duration: 'once' as 'once' | 'forever' | 'repeating',
    durationInMonths: '',
    maxRedemptions: '',
    redeemBy: '',
  });

  useEffect(() => {
    if (authLoading || !user) return;
    fetchCoupons();
  }, [user, authLoading]);

  const fetchCoupons = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/coupons', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setCoupons(data.coupons || []);
      } else if (response.status === 401) {
        router.push('/admin/login');
      }
    } catch (error) {
      console.error('Error fetching coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...newCoupon,
          percentOff: newCoupon.percentOff ? parseFloat(newCoupon.percentOff) : undefined,
          amountOff: newCoupon.amountOff ? parseFloat(newCoupon.amountOff) : undefined,
          durationInMonths: newCoupon.durationInMonths ? parseInt(newCoupon.durationInMonths) : undefined,
          maxRedemptions: newCoupon.maxRedemptions ? parseInt(newCoupon.maxRedemptions) : undefined,
          redeemBy: newCoupon.redeemBy ? new Date(newCoupon.redeemBy) : undefined,
        }),
      });

      if (response.ok) {
        setShowCreateForm(false);
        setNewCoupon({
          id: '',
          name: '',
          percentOff: '',
          amountOff: '',
          duration: 'once',
          durationInMonths: '',
          maxRedemptions: '',
          redeemBy: '',
        });
        fetchCoupons();
      } else {
        alert('Failed to create coupon');
      }
    } catch (error) {
      console.error('Error creating coupon:', error);
      alert('Error creating coupon');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/admin/login');
  };

  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 100%)', padding: '40px 20px' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', color: '#fff', textAlign: 'center' }}>
          Loading...
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (loading && !showCreateForm) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 100%)', padding: '40px 20px' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', color: '#fff', textAlign: 'center' }}>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 100%)', padding: '40px 20px' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
          <div>
            <h1 style={{ color: '#fff', fontSize: 32, margin: 0 }}>Coupon Management</h1>
            <p style={{ color: '#9aa3b2', margin: '8px 0 0 0' }}>Create and manage discount coupons</p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              style={{
                background: showCreateForm ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                border: `1px solid ${showCreateForm ? 'rgba(239, 68, 68, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`,
                color: showCreateForm ? '#ef4444' : '#60a5fa',
                padding: '12px 24px',
                borderRadius: 8,
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {showCreateForm ? 'Cancel' : '+ Create Coupon'}
            </button>
            <Link
              href="/admin/dashboard"
              style={{
                background: 'rgba(156, 163, 175, 0.2)',
                border: '1px solid rgba(156, 163, 175, 0.3)',
                color: '#9ca3af',
                padding: '12px 24px',
                borderRadius: 8,
                fontSize: 15,
                fontWeight: 600,
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              ← Back to Dashboard
            </Link>
            <button
              onClick={handleLogout}
              style={{
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#ef4444',
                padding: '12px 24px',
                borderRadius: 8,
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Logout
            </button>
          </div>
        </div>

        {/* Create Coupon Form */}
        {showCreateForm && (
          <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 24, marginBottom: 40 }}>
            <h2 style={{ color: '#fff', fontSize: 20, marginBottom: 20 }}>Create New Coupon</h2>
            <form onSubmit={handleCreateCoupon}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16, marginBottom: 20 }}>
                <div>
                  <label style={{ color: '#9aa3b2', fontSize: 14, display: 'block', marginBottom: 8 }}>Coupon ID *</label>
                  <input
                    type="text"
                    value={newCoupon.id}
                    onChange={e => setNewCoupon({...newCoupon, id: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: 8,
                      color: '#fff',
                      fontSize: 14,
                    }}
                    placeholder="SUMMER2024"
                    required
                  />
                </div>
                <div>
                  <label style={{ color: '#9aa3b2', fontSize: 14, display: 'block', marginBottom: 8 }}>Name *</label>
                  <input
                    type="text"
                    value={newCoupon.name}
                    onChange={e => setNewCoupon({...newCoupon, name: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: 8,
                      color: '#fff',
                      fontSize: 14,
                    }}
                    placeholder="Summer Sale 2024"
                    required
                  />
                </div>
                <div>
                  <label style={{ color: '#9aa3b2', fontSize: 14, display: 'block', marginBottom: 8 }}>Percent Off</label>
                  <input
                    type="number"
                    value={newCoupon.percentOff}
                    onChange={e => setNewCoupon({...newCoupon, percentOff: e.target.value, amountOff: ''})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: 8,
                      color: '#fff',
                      fontSize: 14,
                    }}
                    placeholder="20"
                    min="1"
                    max="100"
                  />
                </div>
                <div>
                  <label style={{ color: '#9aa3b2', fontSize: 14, display: 'block', marginBottom: 8 }}>Amount Off ($)</label>
                  <input
                    type="number"
                    value={newCoupon.amountOff}
                    onChange={e => setNewCoupon({...newCoupon, amountOff: e.target.value, percentOff: ''})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: 8,
                      color: '#fff',
                      fontSize: 14,
                    }}
                    placeholder="10.00"
                    min="0.01"
                    step="0.01"
                  />
                </div>
                <div>
                  <label style={{ color: '#9aa3b2', fontSize: 14, display: 'block', marginBottom: 8 }}>Duration *</label>
                  <select
                    value={newCoupon.duration}
                    onChange={e => setNewCoupon({...newCoupon, duration: e.target.value as any})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: 8,
                      color: '#fff',
                      fontSize: 14,
                    }}
                  >
                    <option value="once">Once</option>
                    <option value="forever">Forever</option>
                    <option value="repeating">Repeating</option>
                  </select>
                </div>
                {newCoupon.duration === 'repeating' && (
                  <div>
                    <label style={{ color: '#9aa3b2', fontSize: 14, display: 'block', marginBottom: 8 }}>Duration (Months)</label>
                    <input
                      type="number"
                      value={newCoupon.durationInMonths}
                      onChange={e => setNewCoupon({...newCoupon, durationInMonths: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: 8,
                        color: '#fff',
                        fontSize: 14,
                      }}
                      placeholder="3"
                      min="1"
                    />
                  </div>
                )}
                <div>
                  <label style={{ color: '#9aa3b2', fontSize: 14, display: 'block', marginBottom: 8 }}>Max Redemptions</label>
                  <input
                    type="number"
                    value={newCoupon.maxRedemptions}
                    onChange={e => setNewCoupon({...newCoupon, maxRedemptions: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: 8,
                      color: '#fff',
                      fontSize: 14,
                    }}
                    placeholder="100"
                    min="1"
                  />
                </div>
                <div>
                  <label style={{ color: '#9aa3b2', fontSize: 14, display: 'block', marginBottom: 8 }}>Expires</label>
                  <input
                    type="datetime-local"
                    value={newCoupon.redeemBy}
                    onChange={e => setNewCoupon({...newCoupon, redeemBy: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: 8,
                      color: '#fff',
                      fontSize: 14,
                    }}
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                style={{
                  background: 'rgba(59, 130, 246, 0.2)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  color: '#60a5fa',
                  padding: '12px 24px',
                  borderRadius: 8,
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? 'Creating...' : 'Create Coupon'}
              </button>
            </form>
          </div>
        )}

        {/* Coupons List */}
        <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 24 }}>
          <h2 style={{ color: '#fff', fontSize: 20, marginBottom: 20 }}>Active Coupons</h2>

          {coupons.length === 0 ? (
            <p style={{ color: '#9aa3b2', textAlign: 'center', padding: 40 }}>No coupons created yet</p>
          ) : (
            <div style={{ display: 'grid', gap: 16 }}>
              {coupons.map((coupon) => (
                <div
                  key={coupon.id}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8,
                    padding: 16,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ color: '#fff', fontSize: 16, fontWeight: 600 }}>{coupon.name}</div>
                    <div style={{ color: '#9aa3b2', fontSize: 14 }}>ID: {coupon.id}</div>
                    <div style={{ color: '#60a5fa', fontSize: 14 }}>
                      {coupon.percent_off ? `${coupon.percent_off}% off` : `$${coupon.amount_off / 100} off`}
                      {coupon.duration === 'repeating' && ` for ${coupon.duration_in_months} months`}
                      {coupon.duration === 'forever' && ' forever'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#9aa3b2', fontSize: 12 }}>
                      Used: {coupon.times_redeemed || 0}
                      {coupon.max_redemptions && ` / ${coupon.max_redemptions}`}
                    </div>
                    {coupon.redeem_by && (
                      <div style={{ color: '#9aa3b2', fontSize: 12 }}>
                        Expires: {new Date(coupon.redeem_by * 1000).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}