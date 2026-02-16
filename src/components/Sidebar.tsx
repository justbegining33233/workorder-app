'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface MenuItem {
  icon: string;
  label: string;
  href: string;
  badge?: number;
}

interface SidebarProps {
  role: 'shop' | 'manager' | 'tech';
  isOpen?: boolean;
  onClose?: () => void;
  onSelectTab?: (tab: string) => void;
  activeHash?: string;
}

export default function Sidebar({ role, isOpen = true, onClose, onSelectTab, activeHash }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [currentHash, setCurrentHash] = useState('');

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    const handleHashChange = () => setCurrentHash(window.location.hash || '');
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const shopMenuItems: MenuItem[] = [
    { icon: '📊', label: 'Dashboard', href: '/shop/admin#overview' },
    { icon: '🏪', label: 'Shop Home', href: '/shop/home' },
    { icon: '🗂', label: 'Assign Work Orders', href: '/workorders/list' },
    { icon: '👥', label: 'Team Management', href: '/shop/manage-team' },
    { icon: '💰', label: 'Payroll', href: '/shop/admin#payroll' },
    { icon: '📦', label: 'Inventory', href: '/shop/admin#inventory' },
    { icon: '⚙️', label: 'Settings', href: '/shop/admin/settings' },
    { icon: '💬', label: 'Messages', href: '/shop/admin#messages' },
    { icon: '📈', label: 'Tech Reports', href: '/shop/reports' },
  ];

  const managerMenuItems: MenuItem[] = [
    { icon: '🏠', label: 'Home', href: '/manager/home' },
    { icon: '🗂', label: 'Assign Work Orders', href: '/workorders/list' },
    { icon: '⏰', label: 'Time Clock', href: '/manager/home#timeclock' },
    { icon: '📦', label: 'Inventory Requests', href: '/manager/home#inventory' },
    { icon: '💬', label: 'Messages', href: '/manager/home#messages' },
    { icon: '👥', label: 'View Team', href: '/shop/manage-team' },
    { icon: '🔧', label: 'All Tools', href: '/tech/all-tools' },
  ];

  const techMenuItems: MenuItem[] = [
    { icon: '🏠', label: 'Home', href: '/tech/home' },
    { icon: '⏰', label: 'Time Clock', href: '/tech/home#timeclock' },
    { icon: '📋', label: 'My Jobs', href: '/tech/home#jobs' },
    { icon: '💬', label: 'Messages', href: '/tech/home#messages' },
    { icon: '🔧', label: 'All Tools', href: '/tech/all-tools' },
    { icon: '📸', label: 'Photos', href: '/tech/photos' },
  ];

  const menuItems = role === 'shop' ? shopMenuItems : role === 'manager' ? managerMenuItems : techMenuItems;

  const isActive = (href: string) => {
    if (href.includes('#')) {
      const [base, hash] = href.split('#');
      const hashValue = activeHash || currentHash;
      return pathname === base && hashValue === `#${hash}`;
    }
    return pathname === href;
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay for mobile */}
      {isMobile && isOpen && onClose && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 998,
          }}
        />
      )}

      {/* Sidebar */}
      <aside style={{
        width: collapsed ? 70 : 240,
        minWidth: collapsed ? 70 : 240,
        height: '100vh',
        background: 'linear-gradient(180deg, #1f2937 0%, #111827 100%)',
        borderRight: '2px solid rgba(229,51,42,0.2)',
        position: isMobile ? 'fixed' : 'sticky',
        top: 0,
        left: isMobile && !isOpen ? -240 : 0,
        transition: 'all 0.3s ease',
        overflowY: 'auto',
        overflowX: 'hidden',
        zIndex: 999,
      }}>
        {/* Collapse Toggle */}
        <div style={{
          padding: 16,
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          justifyContent: collapsed ? 'center' : 'flex-end',
        }}>
          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#9ca3af',
              padding: 8,
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 16,
              width: collapsed ? '100%' : 'auto',
            }}
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? '→' : '←'}
          </button>
        </div>

        {/* Menu Items */}
        <nav style={{ padding: collapsed ? '8px 4px' : '16px 8px' }}>
          {menuItems.map((item, index) => {
            const active = isActive(item.href);

            const handleClick = (e: React.MouseEvent) => {
              // Let parent handle tab selection for hash links on the same page
              if (onSelectTab && item.href.includes('#')) {
                const [, hash] = item.href.split('#');
                if (hash) {
                  e.preventDefault();
                  onSelectTab(hash);
                  setCurrentHash(`#${hash}`);
                }
              }

              if (isMobile && onClose) {
                onClose();
              }
            };

            return (
              <Link
                key={index}
                href={item.href}
                onClick={handleClick}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: collapsed ? '12px 8px' : '12px 16px',
                  marginBottom: 4,
                  borderRadius: 8,
                  textDecoration: 'none',
                  background: active ? 'rgba(229,51,42,0.2)' : 'transparent',
                  border: active ? '1px solid rgba(229,51,42,0.4)' : '1px solid transparent',
                  color: active ? '#e5332a' : '#9ca3af',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                    e.currentTarget.style.color = '#e5e7eb';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#9ca3af';
                  }
                }}
                title={collapsed ? item.label : undefined}
              >
                <span style={{ fontSize: 20, flexShrink: 0 }}>{item.icon}</span>
                {!collapsed && (
                  <span style={{ 
                    fontSize: 14, 
                    fontWeight: active ? 600 : 500,
                    flex: 1,
                  }}>
                    {item.label}
                  </span>
                )}
                {!collapsed && item.badge && item.badge > 0 && (
                  <span style={{
                    background: '#e5332a',
                    color: 'white',
                    borderRadius: '50%',
                    width: 20,
                    height: 20,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 10,
                    fontWeight: 700,
                  }}>
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer Info */}
        {!collapsed && (
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: 16,
            borderTop: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(0,0,0,0.2)',
          }}>
            <div style={{ fontSize: 11, color: '#6b7280', textAlign: 'center' }}>
              FixTray v1.0
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
