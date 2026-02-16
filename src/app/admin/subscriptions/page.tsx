'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useRequireAuth } from '@/contexts/AuthContext';

interface SubscriptionData {
  id: string;
  shopId: string;
  plan: string;
  status: string;
  stripeSubscriptionId: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  maxUsers: number;
  maxShops: number;
  shop: {
    shopName: string;
    ownerName: string;
    email: string;
    status: string;
  };
  techs: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  }>;
  userCount: number;
}

interface UserData {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  createdAt: string;
}

export default function AdminSubscriptionsPage() {
  const { user, isLoading: authLoading } = useRequireAuth(['admin']);
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState<SubscriptionData[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'subscriptions' | 'users' | 'hierarchy'>('subscriptions');

  useEffect(() => {
    if (authLoading || !user) return;
    fetchData();
  }, [user, authLoading]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');

      // Fetch subscriptions with shop and user details
      const subsResponse = await fetch('/api/admin/subscriptions', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (subsResponse.ok) {
        const subsData = await subsResponse.json();
        setSubscriptions(subsData.subscriptions);
      }

      // Fetch all users
      const usersResponse = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData.users);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/admin/login');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'trialing': return '#f59e0b';
      case 'cancelled': return '#ef4444';
      case 'past_due': return '#f97316';
      default: return '#6b7280';
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'starter': return '#6b7280';
      case 'growth': return '#3b82f6';
      case 'professional': return '#8b5cf6';
      case 'business': return '#f59e0b';
      case 'enterprise': return '#10b981';
      default: return '#6b7280';
    }
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

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 100%)', padding: '40px 20px' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', color: '#fff', textAlign: 'center' }}>
          Loading subscription data...
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
            <h1 style={{ color: '#fff', fontSize: 32, margin: 0 }}>Subscription & User Management</h1>
            <p style={{ color: '#9aa3b2', margin: '8px 0 0 0' }}>Superadmin: {user?.name || 'Admin'}</p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <Link
              href="/admin/dashboard"
              style={{
                background: 'rgba(59, 130, 246, 0.2)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                color: '#60a5fa',
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

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 32, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 16 }}>
          {[
            { id: 'subscriptions', label: 'Subscriptions', count: subscriptions.length },
            { id: 'users', label: 'All Users', count: users.length },
            { id: 'hierarchy', label: 'Account Hierarchy', count: subscriptions.length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                background: activeTab === tab.id ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                border: activeTab === tab.id ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid transparent',
                color: activeTab === tab.id ? '#60a5fa' : '#9aa3b2',
                padding: '12px 24px',
                borderRadius: 8,
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              {tab.label}
              <span style={{
                background: activeTab === tab.id ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255,255,255,0.1)',
                color: activeTab === tab.id ? '#60a5fa' : '#9aa3b2',
                padding: '2px 8px',
                borderRadius: 12,
                fontSize: 12,
                fontWeight: 700,
              }}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Subscriptions Tab */}
        {activeTab === 'subscriptions' && (
          <div style={{ display: 'grid', gap: 20 }}>
            <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 24 }}>
              <h2 style={{ color: '#fff', fontSize: 24, marginBottom: 20 }}>All Subscriptions</h2>

              <div style={{ display: 'grid', gap: 16 }}>
                {subscriptions.map(subscription => (
                  <div key={subscription.id} style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: 8,
                    padding: 20,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                      <div>
                        <h3 style={{ color: '#fff', fontSize: 18, margin: 0 }}>{subscription.shop.shopName}</h3>
                        <p style={{ color: '#9aa3b2', margin: '4px 0', fontSize: 14 }}>
                          Owner: {subscription.shop.ownerName} • {subscription.shop.email}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{
                          background: getStatusColor(subscription.status),
                          color: '#fff',
                          padding: '4px 12px',
                          borderRadius: 16,
                          fontSize: 12,
                          fontWeight: 700,
                          display: 'inline-block',
                          marginBottom: 8,
                        }}>
                          {subscription.status.toUpperCase()}
                        </div>
                        <div style={{
                          background: getPlanColor(subscription.plan),
                          color: '#fff',
                          padding: '4px 12px',
                          borderRadius: 16,
                          fontSize: 12,
                          fontWeight: 700,
                          display: 'inline-block',
                        }}>
                          {subscription.plan.toUpperCase()}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 16 }}>
                      <div>
                        <div style={{ color: '#9aa3b2', fontSize: 12 }}>Users</div>
                        <div style={{ color: '#fff', fontSize: 16, fontWeight: 600 }}>
                          {subscription.userCount} / {subscription.maxUsers === -1 ? '∞' : subscription.maxUsers}
                        </div>
                      </div>
                      <div>
                        <div style={{ color: '#9aa3b2', fontSize: 12 }}>Shops</div>
                        <div style={{ color: '#fff', fontSize: 16, fontWeight: 600 }}>
                          1 / {subscription.maxShops === -1 ? '∞' : subscription.maxShops}
                        </div>
                      </div>
                      <div>
                        <div style={{ color: '#9aa3b2', fontSize: 12 }}>Period Start</div>
                        <div style={{ color: '#fff', fontSize: 14 }}>
                          {new Date(subscription.currentPeriodStart).toLocaleDateString()}
                        </div>
                      </div>
                      <div>
                        <div style={{ color: '#9aa3b2', fontSize: 12 }}>Period End</div>
                        <div style={{ color: '#fff', fontSize: 14 }}>
                          {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    {subscription.techs.length > 0 && (
                      <div>
                        <div style={{ color: '#9aa3b2', fontSize: 12, marginBottom: 8 }}>Team Members</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {subscription.techs.map(tech => (
                            <div key={tech.id} style={{
                              background: 'rgba(59, 130, 246, 0.1)',
                              border: '1px solid rgba(59, 130, 246, 0.3)',
                              color: '#60a5fa',
                              padding: '4px 8px',
                              borderRadius: 6,
                              fontSize: 12,
                            }}>
                              {tech.firstName} {tech.lastName} ({tech.role})
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div style={{ display: 'grid', gap: 20 }}>
            <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 24 }}>
              <h2 style={{ color: '#fff', fontSize: 24, marginBottom: 20 }}>All Users</h2>

              <div style={{ display: 'grid', gap: 12 }}>
                {users.map(user => (
                  <div key={user.id} style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: 8,
                    padding: 16,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    <div>
                      <div style={{ color: '#fff', fontSize: 16, fontWeight: 600 }}>
                        {user.firstName} {user.lastName}
                      </div>
                      <div style={{ color: '#9aa3b2', fontSize: 14 }}>
                        {user.email} • @{user.username}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{
                        background: user.role === 'admin' ? '#ef4444' : user.role === 'tech' ? '#8b5cf6' : '#10b981',
                        color: '#fff',
                        padding: '4px 12px',
                        borderRadius: 16,
                        fontSize: 12,
                        fontWeight: 700,
                        display: 'inline-block',
                        marginBottom: 4,
                      }}>
                        {user.role.toUpperCase()}
                      </div>
                      <div style={{ color: '#9aa3b2', fontSize: 12 }}>
                        Joined {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Hierarchy Tab */}
        {activeTab === 'hierarchy' && (
          <div style={{ display: 'grid', gap: 20 }}>
            <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 24 }}>
              <h2 style={{ color: '#fff', fontSize: 24, marginBottom: 20 }}>Account Hierarchy</h2>

              <div style={{ display: 'grid', gap: 24 }}>
                {subscriptions.map(subscription => (
                  <div key={subscription.id} style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: 8,
                    padding: 20,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                      <div style={{
                        background: getPlanColor(subscription.plan),
                        color: '#fff',
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 16,
                        fontWeight: 700,
                      }}>
                        {subscription.plan.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 style={{ color: '#fff', fontSize: 18, margin: 0 }}>{subscription.shop.shopName}</h3>
                        <p style={{ color: '#9aa3b2', margin: '4px 0', fontSize: 14 }}>
                          Status: <span style={{ color: getStatusColor(subscription.status) }}>{subscription.status}</span>
                        </p>
                      </div>
                    </div>

                    <div style={{ marginLeft: 56 }}>
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ color: '#9aa3b2', fontSize: 12, marginBottom: 4 }}>ACCOUNT OWNER (ADMIN)</div>
                        <div style={{
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          color: '#ef4444',
                          padding: '8px 12px',
                          borderRadius: 6,
                          display: 'inline-block',
                          fontSize: 14,
                          fontWeight: 600,
                        }}>
                          👑 {subscription.shop.ownerName} ({subscription.shop.email})
                        </div>
                      </div>

                      {subscription.techs.length > 0 && (
                        <div>
                          <div style={{ color: '#9aa3b2', fontSize: 12, marginBottom: 8 }}>TEAM MEMBERS</div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 8 }}>
                            {subscription.techs.map(tech => (
                              <div key={tech.id} style={{
                                background: tech.role === 'manager' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                                border: tech.role === 'manager' ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(59, 130, 246, 0.3)',
                                color: tech.role === 'manager' ? '#f59e0b' : '#3b82f6',
                                padding: '8px 12px',
                                borderRadius: 6,
                                fontSize: 14,
                              }}>
                                {tech.role === 'manager' ? '👔' : '🔧'} {tech.firstName} {tech.lastName} ({tech.role})
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}