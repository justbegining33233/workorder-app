'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSocket } from '@/lib/socket';

interface TopNavBarProps {
  onMenuToggle?: () => void;
  showMenuButton?: boolean;
}

export default function TopNavBar({ onMenuToggle, showMenuButton = false }: TopNavBarProps) {
  const { isConnected, emit, on, off } = useSocket();
  const [userRole, setUserRole] = useState('');
  const [shopName, setShopName] = useState('');
  const [shopId, setShopId] = useState('');
  const [userId, setUserId] = useState('');
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; body: string; time: string; read?: boolean; type?: string }>>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [notificationSoundEnabled, setNotificationSoundEnabled] = useState(true);
  const [notificationPreferences, setNotificationPreferences] = useState<Record<string, boolean>>({});
  const lastUnreadRef = useRef(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const role = localStorage.getItem('userRole');
    const shop = localStorage.getItem('shopId');
    const user = localStorage.getItem('userId');

    setUserRole(role || '');
    setUserId(user || '');

    if (shop) {
      setShopId(shop);
      fetchShopName(shop);
    }

    if (user && (role === 'tech' || role === 'manager')) {
      checkClockInStatus(user);
    }

    const interval = setInterval(() => {
      if (user && (role === 'tech' || role === 'manager')) checkClockInStatus(user);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!shopId) return;

    const fetchNotificationSettings = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const response = await fetch(`/api/shops/settings?shopId=${shopId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          const settings = data.settings || data.shop?.settings || {};
          if (settings) {
            setNotificationsEnabled(settings.notificationsEnabled ?? true);
            setNotificationSoundEnabled(settings.notificationSoundEnabled ?? true);
            setNotificationPreferences(settings.notificationPreferences || {});
          }
        }
      } catch (error) {
        console.error('Error loading notification settings:', error);
      }
    };

    fetchNotificationSettings();
    const interval = setInterval(fetchNotificationSettings, 30000);
    return () => clearInterval(interval);
  }, [shopId]);

  const formatTimeAgo = (dateValue: string) => {
    const date = new Date(dateValue);
    const diffMs = Date.now() - date.getTime();
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const fetchMessageNotifications = async () => {
    try {
      if (typeof window === 'undefined') return;
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/messages', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) return;
      const data = await response.json();
      const conversations = Array.isArray(data?.conversations) ? data.conversations : [];

      const messageNotifications = conversations
        .filter((conv: any) => conv.unreadCount > 0)
        .map((conv: any) => ({
          id: `msg-${conv.contactRole}-${conv.contactId}`,
          title: `New message from ${conv.contactName || 'Contact'}`,
          body: conv.lastMessage,
          time: formatTimeAgo(conv.lastMessageAt),
          read: false,
          type: 'messages',
        }));

      setNotifications(messageNotifications);
    } catch (error) {
      console.error('Error fetching message notifications:', error);
    }
  };

  useEffect(() => {
    fetchMessageNotifications();
    const interval = setInterval(fetchMessageNotifications, 8000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isConnected) return;

    const handleClockStatusChanged = (data: any) => {
      if (data.userId === userId) {
        setIsClockedIn(data.isClockedIn);
      }
    };

    on('clock-status-changed', handleClockStatusChanged);

    return () => {
      off('clock-status-changed', handleClockStatusChanged);
    };
  }, [isConnected, on, off, userId]);

  const fetchShopName = async (id: string) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const response = await fetch(`/api/shop?shopId=${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (response.ok) {
        const { shop } = await response.json();
        setShopName(shop.shopName || 'Shop');
      }
    } catch (error) {
      console.error('Error fetching shop name:', error);
    }
  };

  const checkClockInStatus = async (id: string) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const response = await fetch(`/api/timeclock/status?userId=${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (response.ok) {
        const { isClockedIn: status } = await response.json();
        setIsClockedIn(status);
      }
    } catch (error) {
      console.error('Error checking clock-in status:', error);
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
        body: JSON.stringify({ userId, action }),
      });

      if (response.ok) {
        const result = await response.json();
        setIsClockedIn(!isClockedIn);
        alert(result.message);

        if (emit) {
          emit('clock-status-change', { isClockedIn: !isClockedIn });
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

  const filteredNotifications = notificationsEnabled
    ? notifications.filter((n) => (n.type ? notificationPreferences[n.type] !== false : true))
    : [];

  const unreadCount = filteredNotifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const playNotificationChime = () => {
    if (!notificationSoundEnabled) return;
    try {
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = 880;
      gain.gain.value = 0.04;
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.12);
    } catch (error) {
      console.warn('Notification chime blocked:', error);
    }
  };

  useEffect(() => {
    if (!notificationsEnabled) return;
    if (unreadCount > lastUnreadRef.current) {
      playNotificationChime();
    }
    lastUnreadRef.current = unreadCount;
  }, [unreadCount, notificationsEnabled, notificationSoundEnabled]);

  const NotificationButton = () => (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button
        onClick={() => setShowNotifications(prev => !prev)}
        style={{
          position: 'relative',
          padding: '8px 12px',
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.1)',
          color: '#e5e7eb',
          borderRadius: 8,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span role="img" aria-label="Notifications">🔔</span>
        {unreadCount > 0 && (
          <span style={{
            background: '#ef4444',
            color: 'white',
            borderRadius: 999,
            padding: '2px 8px',
            fontSize: 11,
            fontWeight: 700,
            lineHeight: 1,
          }}>{unreadCount}</span>
        )}
      </button>

      {showNotifications && (
        <div style={{
          position: 'absolute',
          right: 0,
          marginTop: 8,
          width: 320,
          background: '#0f172a',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 12px 30px rgba(0,0,0,0.35)',
          borderRadius: 12,
          overflow: 'hidden',
          zIndex: 2000,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ color: '#e5e7eb', fontWeight: 700, fontSize: 14 }}>Notifications</div>
            <button onClick={markAllAsRead} style={{ background: 'transparent', border: 'none', color: '#93c5fd', fontSize: 12, cursor: 'pointer' }}>
              Mark all read
            </button>
          </div>

          <div style={{ maxHeight: 360, overflowY: 'auto' }}>
            {filteredNotifications.length === 0 ? (
              <div style={{ padding: 16, color: '#9ca3af', fontSize: 13 }}>No notifications</div>
            ) : filteredNotifications.map(n => (
              <div key={n.id} style={{ padding: 12, borderBottom: '1px solid rgba(255,255,255,0.05)', background: n.read ? 'transparent' : 'rgba(37,99,235,0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <div style={{ color: '#e5e7eb', fontWeight: 700, fontSize: 13 }}>{n.title}</div>
                  <span style={{ color: '#9ca3af', fontSize: 12 }}>{n.time}</span>
                </div>
                <div style={{ color: '#cbd5e1', fontSize: 12, marginTop: 4 }}>{n.body}</div>
                {!n.read && (
                  <button onClick={() => markAsRead(n.id)} style={{ marginTop: 8, background: 'transparent', border: 'none', color: '#93c5fd', fontSize: 12, cursor: 'pointer' }}>
                    Mark read
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const liveIndicator = true;

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
              border: '1px solid rgba(255,255,255,0.1)',
              whiteSpace: 'nowrap',
            }}>
              {shopName}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {getRoleBadge()}

          <NotificationButton />

          {userRole === 'tech' || userRole === 'manager' ? (
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
          ) : null}

          <div
            title={liveIndicator ? 'Connected to real-time server' : 'Disconnected from real-time server'}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.05)' }}
          >
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: liveIndicator ? '#22c55e' : '#6b7280', display: 'inline-block' }} />
            <span style={{ fontSize: 12, color: liveIndicator ? '#22c55e' : '#9ca3b2', fontWeight: 600 }}>{liveIndicator ? 'Live' : 'Offline'}</span>
          </div>

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
