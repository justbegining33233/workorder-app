'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface MobileNavProps {
  role: 'customer' | 'shop' | 'tech' | 'manager';
}

interface NavItem {
  icon: string;
  label: string;
  path: string;
}

// PRIMARY (bottom bar) + MORE (drawer) items per role
const navConfig: Record<string, { primary: NavItem[]; more: NavItem[] }> = {
  customer: {
    primary: [
      { icon: '🏠', label: 'Home',    path: '/customer/dashboard' },
      { icon: '🗓️', label: 'Appts',   path: '/customer/appointments' },
      { icon: '🔧', label: 'Repairs', path: '/customer/repairs' },
      { icon: '💬', label: 'Chat',    path: '/customer/messages' },
    ],
    more: [
      { icon: '👤', label: 'Profile',   path: '/customer/overview' },
      { icon: '⭐', label: 'Reviews',   path: '/customer/reviews' },
      { icon: '💳', label: 'Payments',  path: '/customer/payments' },
      { icon: '🚗', label: 'My Cars',   path: '/customer/vehicles' },
    ],
  },
  shop: {
    primary: [
      { icon: '🏠', label: 'Home',    path: '/shop/home' },
      { icon: '🗂',  label: 'Orders',  path: '/workorders/list' },
      { icon: '💬', label: 'Messages', path: '/shop/customer-messages' },
      { icon: '👥', label: 'Team',     path: '/shop/manage-team' },
    ],
    more: [
      { icon: '📦', label: 'Inventory',  path: '/shop/inventory' },
      { icon: '💰', label: 'Payroll',    path: '/shop/payroll' },
      { icon: '📈', label: 'Reports',    path: '/shop/reports' },
      { icon: '🚗', label: 'Bay Board',  path: '/shop/bays' },
      { icon: '⭐', label: 'Reviews',    path: '/shop/reviews' },
      { icon: '⚙️', label: 'Settings',  path: '/shop/settings' },
    ],
  },
  tech: {
    primary: [
      { icon: '🏠', label: 'Home',      path: '/tech/home' },
      { icon: '📋', label: 'My Jobs',   path: '/workorders/list' },
      { icon: '⏰', label: 'Clock',     path: '/tech/home#timeclock' },
      { icon: '💬', label: 'Messages',  path: '/tech/messages' },
    ],
    more: [
      { icon: '🔍', label: 'DVI Form',    path: '/tech/dvi' },
      { icon: '🔎', label: 'DTC Lookup',  path: '/tech/dtc-lookup' },
      { icon: '📸', label: 'Photos',      path: '/tech/photos' },
      { icon: '🔧', label: 'All Tools',   path: '/tech/all-tools' },
      { icon: '📦', label: 'Inventory',   path: '/tech/inventory' },
      { icon: '📍', label: 'Location',    path: '/tech/share-location' },
    ],
  },
  manager: {
    primary: [
      { icon: '🏠', label: 'Home',       path: '/manager/home' },
      { icon: '📋', label: 'Assign',     path: '/manager/assignments' },
      { icon: '👥', label: 'Team',       path: '/manager/team' },
      { icon: '💬', label: 'Messages',   path: '/manager/home#messages' },
    ],
    more: [
      { icon: '📝', label: 'Estimates',  path: '/manager/estimates' },
      { icon: '⏰', label: 'Time Clock', path: '/manager/home#timeclock' },
      { icon: '📦', label: 'Inventory',  path: '/manager/home#inventory' },
      { icon: '🗂',  label: 'All Orders', path: '/workorders/list' },
    ],
  },
};

export default function MobileNav({ role }: MobileNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  if (!isMobile) return null;

  const config = navConfig[role] ?? navConfig.shop;
  const { primary, more } = config;

  const isActive = (path: string) =>
    path === pathname || (path !== '/' && !path.includes('#') && (pathname ?? '').startsWith(path + '/'));

  return (
    <>
      {/* More drawer backdrop */}
      {drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 1090,
            backdropFilter: 'blur(2px)',
          }}
        />
      )}

      {/* More drawer */}
      <div style={{
        position: 'fixed',
        bottom: drawerOpen ? 68 : -400,
        left: 0, right: 0,
        background: 'linear-gradient(180deg, #1a2234 0%, #0f172a 100%)',
        borderTop: '1px solid rgba(229,51,42,0.25)',
        borderRadius: '20px 20px 0 0',
        zIndex: 1095,
        transition: 'bottom 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        padding: '16px 16px 24px',
      }}>
        <div style={{
          width: 40, height: 4, borderRadius: 2,
          background: 'rgba(255,255,255,0.15)',
          margin: '0 auto 16px',
        }} />
        <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, letterSpacing: '0.06em', marginBottom: 12, textTransform: 'uppercase' }}>
          More
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 8,
        }}>
          {more.map((item) => {
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => { router.push(item.path); setDrawerOpen(false); }}
                style={{
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', gap: 6,
                  padding: '12px 4px',
                  background: active ? 'rgba(229,51,42,0.15)' : 'rgba(255,255,255,0.04)',
                  border: active ? '1px solid rgba(229,51,42,0.3)' : '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 12,
                  color: active ? '#f87171' : '#9ca3af',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                <span style={{ fontSize: 22 }}>{item.icon}</span>
                <span style={{ fontSize: 10, fontWeight: 500 }}>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom nav bar */}
      <div style={{
        position: 'fixed',
        bottom: 0, left: 0, right: 0,
        // minHeight covers the tap targets; padding adds safe-area on notch/gesture-nav devices
        // env(safe-area-inset-bottom) resolves correctly on:
        //   iOS Safari (any notched iPhone), Android Chrome 69+ with viewport-fit=cover
        //   Falls back to 0 on older Android — the 68px height alone is sufficient there
        minHeight: 'calc(68px + env(safe-area-inset-bottom, 0px))',
        background: 'rgba(10,15,28,0.97)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'flex-start',  // items sit at top; padding pushes bar down
        paddingTop: 0,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        zIndex: 1100,
        backdropFilter: 'blur(12px)',
      }}>
        {primary.map((item) => {
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              style={{
                flex: 1,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 3,
                background: 'none', border: 'none',
                color: active ? '#e5332a' : '#6b7280',
                cursor: 'pointer',
                position: 'relative',
                transition: 'color 0.15s',
              }}
            >
              {active && (
                <div style={{
                  position: 'absolute', top: 0, left: '25%', right: '25%',
                  height: 2, borderRadius: '0 0 2px 2px',
                  background: '#e5332a',
                }} />
              )}
              <span style={{ fontSize: 20 }}>{item.icon}</span>
              <span style={{ fontSize: 10, fontWeight: active ? 600 : 400, letterSpacing: '0.02em' }}>
                {item.label}
              </span>
            </button>
          );
        })}

        {/* More button */}
        <button
          onClick={() => setDrawerOpen(!drawerOpen)}
          style={{
            flex: 1,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 3,
            background: 'none', border: 'none',
            color: drawerOpen ? '#e5332a' : '#6b7280',
            cursor: 'pointer',
            transition: 'color 0.15s',
          }}
        >
          <span style={{ fontSize: 20 }}>{drawerOpen ? '✕' : '⋯'}</span>
          <span style={{ fontSize: 10, fontWeight: 400 }}>More</span>
        </button>
      </div>
    </>
  );
}
