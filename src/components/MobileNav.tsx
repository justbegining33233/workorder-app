'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface MobileNavProps {
  role: 'customer' | 'shop' | 'tech' | 'manager';
}

export default function MobileNav({ role }: MobileNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!isMobile) return null;

  const getNavItems = () => {
    switch (role) {
      case 'customer':
        return [
          { icon: '🏠', label: 'Home', path: '/customer/dashboard' },
          { icon: '📅', label: 'Appointments', path: '/customer/appointments' },
          { icon: '💬', label: 'Messages', path: '/customer/messages' },
          { icon: '👤', label: 'Profile', path: '/customer/overview' },
        ];
      case 'shop':
        return [
          { icon: '🏠', label: 'Dashboard', path: '/shop/home' },
          { icon: '🔧', label: 'Work Orders', path: '/workorders/list' },
          { icon: '👥', label: 'Team', path: '/shop/manage-team' },
          { icon: '⚙️', label: 'Settings', path: '/shop/admin/settings' },
        ];
      case 'tech':
        return [
          { icon: '🏠', label: 'Dashboard', path: '/tech/home' },
          { icon: '📋', label: 'My Jobs', path: '/workorders/list' },
          { icon: '💬', label: 'Messages', path: '/tech/messages' },
          { icon: '⏰', label: 'Time Clock', path: '/tech/timesheet' },
        ];
      case 'manager':
        return [
          { icon: '🏠', label: 'Dashboard', path: '/manager/dashboard' },
          { icon: '📋', label: 'Assignments', path: '/manager/assignments' },
          { icon: '📊', label: 'Reports', path: '/shop/reports' },
          { icon: '⚙️', label: 'Settings', path: '/manager/home' },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: 'rgba(0,0,0,0.95)',
      borderTop: '1px solid rgba(255,255,255,0.1)',
      padding: '8px 0',
      zIndex: 1000,
      backdropFilter: 'blur(10px)',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        maxWidth: '100%',
      }}>
        {navItems.map((item) => {
          const isActive = pathname && (pathname === item.path || pathname.startsWith(item.path + '/'));
          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                padding: '12px 8px',
                minWidth: '60px',
                background: 'none',
                border: 'none',
                color: isActive ? '#e5332a' : '#9aa3b2',
                cursor: 'pointer',
                borderRadius: '8px',
                transition: 'all 0.2s',
                fontSize: '12px',
              }}
            >
              <span style={{ fontSize: '18px', lineHeight: 1 }}>{item.icon}</span>
              <span style={{ fontSize: '10px', fontWeight: '500' }}>{item.label}</span>
              {isActive && (
                <div style={{
                  position: 'absolute',
                  bottom: '8px',
                  width: '24px',
                  height: '2px',
                  background: '#e5332a',
                  borderRadius: '1px',
                }} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}