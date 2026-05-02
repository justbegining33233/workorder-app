"use client";
import { FaCheck } from 'react-icons/fa';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRequireAuth } from '@/contexts/AuthContext';
import { SUBSCRIPTION_PLANS, type SubscriptionPlan } from '@/lib/subscription';
import {
  PLAN_AUDIENCE,
  PLAN_MARKETING_HIGHLIGHTS,
  PLAN_ORDER,
  getPlanCapacityLine,
} from '@/lib/subscription-copy';

const PLAN_COLORS: Record<SubscriptionPlan, string> = {
  starter: '#3b82f6',
  growth: '#22c55e',
  professional: '#f59e0b',
  business: '#ef4444',
  enterprise: '#8b5cf6',
};

export default function ShopSubscribePage() {
  const router = useRouter();
  const { user, isLoading } = useRequireAuth(['shop']);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>('professional');
  const [loading, setLoading] = useState(false);
  const [shopId, setShopId] = useState('');
  const [email, setEmail] = useState('');
  const [checkoutError, setCheckoutError] = useState('');

  useEffect(() => {
    setShopId(localStorage.getItem('shopId') || '');
    setEmail(localStorage.getItem('userEmail') || (user as any)?.email || '');
  }, [user]);

  const handleCheckout = async () => {
    if (!selectedPlan) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ plan: selectedPlan, shopId, email }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setCheckoutError(data.error || 'Failed to start checkout. Please try again.');
      }
    } catch {
      setCheckoutError('Checkout failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e5e7eb', fontSize: 18 }}>
        Loading...
      </div>
    );
  }
  if (!user) return null;

  return (
    <div style={{ minHeight: '100vh', background: 'transparent', padding: '48px 24px' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontSize: 13, color: '#6b7280', fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>Step 2 of 2</div>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: '#f9fafb', marginBottom: 12 }}>Choose Your Plan</h1>
          <p style={{ fontSize: 16, color: '#9aa3b2', maxWidth: 480, margin: '0 auto' }}>
            Choose the operating model that matches your shop today. Checkout shows the exact trial terms before billing begins.
          </p>
        </div>

        {/* Plan Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 40 }}>
          {PLAN_ORDER.map((planKey) => {
            const plan = SUBSCRIPTION_PLANS[planKey];
            const color = PLAN_COLORS[planKey];
            const isSelected = selectedPlan === planKey;
            return (
              <div
                key={planKey}
                onClick={() => setSelectedPlan(planKey)}
                style={{
                  background: isSelected ? `${color}1a` : 'rgba(255,255,255,0.04)',
                  border: `2px solid ${isSelected ? color : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 16,
                  padding: 28,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  position: 'relative',
                }}
              >
                {planKey === 'professional' && (
                  <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: '#22c55e', color: 'white', fontSize: 11, fontWeight: 700, padding: '4px 14px', borderRadius: 999, letterSpacing: 1 }}>
                    MOST POPULAR
                  </div>
                )}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#f9fafb', marginBottom: 6 }}>{plan.name}</div>
                  <div style={{ fontSize: 13, color: '#9aa3b2', marginBottom: 8 }}>{PLAN_AUDIENCE[planKey]}</div>
                  <div style={{ fontSize: 12, color: '#cbd5e1', marginBottom: 16, fontWeight: 700, letterSpacing: 0.4 }}>{getPlanCapacityLine(planKey)}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <span style={{ fontSize: 36, fontWeight: 800, color }}>{plan.price}</span>
                    <span style={{ fontSize: 14, color: '#6b7280' }}>/mo</span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {PLAN_MARKETING_HIGHLIGHTS[planKey].map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#cbd5e1' }}>
                      <span style={{ color, fontWeight: 700, fontSize: 16 }}><FaCheck style={{marginRight:4}} /></span>
                      {f}
                    </div>
                  ))}
                </div>
                {isSelected && (
                  <div style={{ marginTop: 20, background: color, borderRadius: 8, padding: '8px 0', textAlign: 'center', fontSize: 13, fontWeight: 700, color: 'white' }}>
                    Selected <FaCheck style={{marginRight:4}} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={handleCheckout}
            disabled={loading}
            style={{ padding: '16px 48px', background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: 'white', border: 'none', borderRadius: 12, fontSize: 17, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, boxShadow: '0 4px 20px rgba(34,197,94,0.3)' }}
          >
            {loading ? 'Redirecting to checkout...' : `Continue with ${SUBSCRIPTION_PLANS[selectedPlan].name}`}
          </button>
          <div style={{ marginTop: 16, fontSize: 13, color: '#6b7280' }}>
            Review pricing, trial terms, and billing details before you confirm checkout
          </div>
          <button
            onClick={() => router.push('/auth/login')}
            style={{ marginTop: 12, background: 'none', border: 'none', color: '#6b7280', fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}
          >
            Back to login
          </button>
        </div>
      </div>
      {checkoutError && (
        <div style={{position:'fixed',bottom:24,right:24,background:'#fde8e8',color:'#991b1b',borderRadius:10,padding:'12px 20px',zIndex:9999,fontSize:14,fontWeight:600,boxShadow:'0 4px 12px rgba(0,0,0,0.3)'}}>
          {checkoutError}
          <button onClick={()=>setCheckoutError('')} style={{marginLeft:12,background:'none',border:'none',cursor:'pointer',fontSize:16,color:'inherit'}}>×</button>
        </div>
      )}
    </div>
  );
}
