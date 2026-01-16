'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSocket } from '@/lib/socket';

interface TopNavBarProps {
  onMenuToggle?: () => void;
  showMenuButton?: boolean;
}

export default function TopNavBar({ onMenuToggle, showMenuButton = false }: TopNavBarProps) {
  const pathname = usePathname();
  const { isConnected, emit, on, off } = useSocket();
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');
  const [shopName, setShopName] = useState('');
  const [shopId, setShopId] = useState('');
  const [userId, setUserId] = useState('');
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    const role = localStorage.getItem('userRole');
    const name = localStorage.getItem('userName');
    const shop = localStorage.getItem('shopId');
    const user = localStorage.getItem('userId');
    
    setUserRole(role || '');
    setUserName(name || '');
    setShopId(shop || '');
    setUserId(user || '');
    
    if (shop) {
      fetchShopName(shop);
    }
    
    if (user) {
      checkClockInStatus(user);
    }
    
    fetchUnreadMessages();
    
    // Refresh every 10 seconds
    const interval = setInterval(() => {
      if (user) checkClockInStatus(user);
      fetchUnreadMessages();
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  // Socket event listeners for real-time updates
  useEffect(() => {
    if (!isConnected) return;

    // Listen for new messages
    const handleNewMessage = (data: any) => {
      fetchUnreadMessages();
    };

    // Listen for clock status changes from other users
    const handleClockStatusChanged = (data: any) => {
      // If this is about the current user, update their status
      if (data.userId === userId) {
        setIsClockedIn(data.isClockedIn);
      }
    };

    on('new-message', handleNewMessage);
    on('clock-status-changed', handleClockStatusChanged);

    return () => {
      off('new-message', handleNewMessage);
      off('clock-status-changed', handleClockStatusChanged);
    };
  }, [isConnected, on, off, userId]);

  const fetchShopName = async (shopId: string) => {
    if (typeof window === 'undefined') return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/shop?shopId=${shopId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const { shop } = await response.json();
        setShopName(shop.shopName || 'Shop');
      }
    } catch (error) {
      console.error('Error fetching shop name:', error);
    }
  };

  const checkClockInStatus = async (userId: string) => {
    if (typeof window === 'undefined') return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/timeclock/status?userId=${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const { isClockedIn: status } = await response.json();
        setIsClockedIn(status);
      }
    } catch (error) {
      console.error('Error checking clock-in status:', error);
    }
  };

  const fetchUnreadMessages = async () => {
    if (typeof window === 'undefined') return;

    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await fetch('/api/messages', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const { unreadByRole } = await response.json();
        const total = Object.values(unreadByRole).reduce((sum: number, count: any) => sum + count, 0);
        setUnreadMessages(total as number);
      }
    } catch (error) {
      // Silent fail
    }
  };

  const getRoleBadge = () => {
    const roles: Record<string, { icon: string; label: string; color: string }> = {
      shop: { icon: '🏪', label: 'Shop Owner', color: '#3b82f6' },
      manager: { icon: '👔', label: 'Manager', color: '#f59e0b' },
      tech: { icon: '🔧', label: 'Tech', color: '#10b981' },
      admin: { icon: '⚙️', label: 'Admin', color: '#8b5cf6' },
      customer: { icon: '👤', label: 'Customer', color: '#6b7280' },
    };
    
    const role = roles[userRole] || { icon: '👤', label: 'User', color: '#6b7280' };
    
    return (
      <span style={{
        padding: '4px 10px',
        background: `${role.color}20`,
        color: role.color,
        border: `1px solid ${role.color}40`,
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 600,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        whiteSpace: 'nowrap',
      }}>
        <span>{role.icon}</span>
        <span>{role.label}</span>
      </span>
    );
  };

  const getHomeLink = () => {
    switch (userRole) {
      case 'shop': return '/shop/admin';
      case 'manager': return '/manager/home';
      case 'tech': return '/tech/home';
      case 'admin': return '/admin/home';
      case 'customer': return '/customer/home';
      default: return '/';
    }
  };

  const handleClockToggle = async () => {
    if (typeof window === 'undefined' || !userId) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const action = isClockedIn ? 'clock-out' : 'clock-in';

      const response = await fetch('/api/timeclock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId,
          action,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setIsClockedIn(!isClockedIn);
        // Show success message
        alert(result.message);

        // Emit real-time update
        if (emit) {
          emit('clock-status-change', {
            isClockedIn: !isClockedIn,
          });
        }
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update clock status');
      }
    } catch (error) {
      console.error('Clock toggle error:', error);
      alert('Failed to update clock status');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    if (typeof window === 'undefined') return;

    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('shopId');
    localStorage.removeItem('userId');
    window.location.href = '/auth/login';
  };

  return (
    <nav style={{
      background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
      borderBottom: '2px solid rgba(229,51,42,0.3)',
      padding: '12px 16px',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    }}>
      <div style={{
        maxWidth: 1400,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
      }}>
        {/* Left Section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {showMenuButton && (
            <button
              onClick={onMenuToggle}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#e5e7eb',
                padding: '8px 12px',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 18,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              ☰
            </button>
          )}
          
          <Link href={getHomeLink()} style={{ textDecoration: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                fontSize: 28,
                fontWeight: 900,
                color: '#e5332a',
                textShadow: '0 2px 4px rgba(0,0,0,0.3)',
              }}>
                FixTray
              </div>
            </div>
          </Link>
          
          {shopName && (
            <div style={{
              padding: '4px 12px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: 6,
              fontSize: 12,
              color: '#9ca3af',
            }}>
              {shopName}
            </div>
          )}
        </div>

        {/* Center Section - User Info */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 8,
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: 2,
          }}>
            <div style={{ 
              color: '#e5e7eb', 
              fontWeight: 600, 
              fontSize: 13,
              display: typeof window !== 'undefined' && window.innerWidth < 640 ? 'none' : 'block',
            }}>
              {userName}
            </div>
            {getRoleBadge()}
          </div>
        </div>

        {/* Right Section - Actions */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 12,
        }}>
          {/* Clock In/Out Button */}
          {(userRole === 'tech' || userRole === 'manager') && (
            <button
              onClick={handleClockToggle}
              disabled={loading}
              style={{
                padding: '8px 16px',
                background: isClockedIn ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)',
                border: isClockedIn ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(34,197,94,0.5)',
                color: isClockedIn ? '#f87171' : '#22c55e',
                borderRadius: 6,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: 12,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                opacity: loading ? 0.6 : 1,
                whiteSpace: 'nowrap',
              }}
            >
              <span>{isClockedIn ? '⏸️' : '▶️'}</span>
              {isClockedIn ? 'Clock Out' : 'Clock In'}
            </button>
          )}

          {/* Messages */}
          <Link 
            href={userRole === 'shop' ? '/shop/admin' : userRole === 'manager' ? '/manager/home' : '/tech/home'}
            style={{ textDecoration: 'none', position: 'relative' }}
          >
            <button style={{
              padding: '8px 16px',
              background: 'rgba(59,130,246,0.2)',
              border: '1px solid rgba(59,130,246,0.5)',
              color: '#3b82f6',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              position: 'relative',
            }}>
              <span>💬</span>
              <span>Messages</span>
              {unreadMessages > 0 && (
                <span style={{
                  position: 'absolute',
                  top: -6,
                  right: -6,
                  background: '#e5332a',
                  color: 'white',
                  borderRadius: '50%',
                  width: 18,
                  height: 18,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10,
                  fontWeight: 700,
                }}>
                  {unreadMessages > 9 ? '9+' : unreadMessages}
                </span>
              )}
            </button>
          </Link>

          {/* Sign Out */}
          <button
            onClick={handleSignOut}
            style={{
              padding: '8px 16px',
              background: '#e5332a',
              border: 'none',
              color: 'white',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}
          >
            Sign Out
          </button>
        </div>
      </div>
    </nav>
  );
}
