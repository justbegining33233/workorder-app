'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Route } from 'next';
import { useRequireAuth } from '@/contexts/AuthContext';
import UpgradePrompt from '@/components/UpgradePrompt';
import { FaArrowLeft, FaBox, FaExclamationTriangle } from 'react-icons/fa';

export default function ManagerInventory() {
  const router = useRouter();
  const { user } = useRequireAuth(['manager']);
  const [hasInventoryAccess, setHasInventoryAccess] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    checkInventoryAccess();
  }, [user]);

  const checkInventoryAccess = async () => {
    try {
      // Check if user has inventory feature access
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user/permissions', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const permissions = await response.json();
        setHasInventoryAccess(permissions.features?.inventory || false);
      }
    } catch (error) {
      console.error('Error checking permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#e5e7eb', fontSize: 20 }}>Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div style={{ minHeight: "100vh", background: 'transparent' }}>
      {/* Header */}
      <div style={{ background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid rgba(229,51,42,0.3)', padding: '20px 32px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <Link href="/manager/dashboard" style={{ color: '#3b82f6', textDecoration: 'none', fontSize: 14, fontWeight: 600, marginBottom: 8, display: 'inline-block' }}>
            <FaArrowLeft style={{marginRight:4}} /> Back to Dashboard
          </Link>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#e5e7eb', marginBottom: 4 }}><FaBox style={{marginRight:4}} /> Inventory Management</h1>
          <p style={{ fontSize: 14, color: '#9aa3b2' }}>Track parts, supplies, and equipment</p>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
        {hasInventoryAccess === false && (
          <div style={{ marginBottom: 32 }}>
            <UpgradePrompt
              shopId={user.shopId || ''}
              trigger="feature-limit"
              feature="inventory"
              currentPlan="starter"
              onUpgrade={(plan) => {
                // Handle upgrade logic here
                console.log('Upgrading to plan:', plan);
                router.push('/shop/subscription' as Route);
              }}
            />
          </div>
        )}

        {hasInventoryAccess ? (
          <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 24 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#e5e7eb', marginBottom: 16 }}>Parts & Supplies</h2>
            <div style={{ textAlign: 'center', color: '#9aa3b2', padding: 40 }}>
              <FaBox style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }} />
              <p>Inventory management interface would be implemented here.</p>
              <p style={{ fontSize: 14, marginTop: 8 }}>This would include parts tracking, stock levels, reorder alerts, etc.</p>
            </div>
          </div>
        ) : (
          <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 24 }}>
            <div style={{ textAlign: 'center', color: '#9aa3b2', padding: 40 }}>
              <FaExclamationTriangle style={{ fontSize: 48, marginBottom: 16, color: '#f59e0b' }} />
              <h3 style={{ fontSize: 18, fontWeight: 600, color: '#e5e7eb', marginBottom: 8 }}>Inventory Management</h3>
              <p>Upgrade your plan to access advanced inventory tracking features.</p>
              <p style={{ fontSize: 14, marginTop: 8 }}>Track parts, manage stock levels, and automate reordering.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}