'use client';

import { useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { Route } from 'next';
import { useIsNative } from '@/context/NativeContext';

export type ShellRole = 'shop' | 'tech' | 'customer' | 'manager' | 'admin';

interface Tile {
  ico: string;
  name: string;
  sub: string;
  href: string;
  badge?: string | number;
  color: string; // bg hex
  span2?: boolean;
}

interface FooterItem {
  ico: string;
  label: string;
  href: string;
  badge?: string | number;
}

interface DrawerSection {
  title: string;
  items: { ico: string; label: string; href: string; badge?: string | number }[];
}

interface NewOption {
  ico: string;
  title: string;
  sub: string;
  href: string;
}

interface RoleConfig {
  accentColor: string;
  roleLabel: string;
  ico: string;
  tiles: Tile[];
  footer: FooterItem[];
  newOptions: NewOption[];
  drawer: DrawerSection[];
}

const ROLES: Record<ShellRole, RoleConfig> = {
  shop: {
    accentColor: '#f59e0b',
    roleLabel: 'Shop Owner',
    ico: '🔧',
    tiles: [
      { ico: '🗂️', name: 'Work Orders', sub: 'Jobs & repairs', href: '/shop/home', color: '#0f1e3a', badge: undefined, span2: true },
      { ico: '📅', name: 'Calendar', sub: 'Appointments', href: '/shop/calendar', color: '#0f2214' },
      { ico: '👥', name: 'Team', sub: 'Manage staff', href: '/shop/manage-team', color: '#1a0f2e' },
      { ico: '💬', name: 'Messages', sub: 'Customer chat', href: '/shop/customer-messages', color: '#0f0f2e' },
      { ico: '🔩', name: 'Inventory', sub: 'Parts & stock', href: '/shop/inventory', color: '#2e1a0a' },
      { ico: '📊', name: 'Reports', sub: "Today's summary", href: '/shop/reports', color: '#0a1e2e' },
      { ico: '💳', name: 'Payroll', sub: 'Staff pay', href: '/shop/payroll', color: '#2e0f0f' },
      { ico: '⚙️', name: 'Settings', sub: 'Shop config', href: '/shop/settings', color: '#111318' },
    ],
    footer: [
      { ico: '🏠', label: 'Home', href: '/shop/home' },
      { ico: '🗂️', label: 'Jobs', href: '/shop/home' },
      { ico: '💬', label: 'Chat', href: '/shop/customer-messages' },
      { ico: '📊', label: 'Reports', href: '/shop/reports' },
    ],
    newOptions: [
      { ico: '🏪', title: 'In-Shop Job', sub: 'Customer at the shop', href: '/shop/new-inshop-job' },
      { ico: '🚐', title: 'Roadside Job', sub: 'Vehicle at another location', href: '/tech/new-roadside-job' },
    ],
    drawer: [
      {
        title: 'Operations',
        items: [
          { ico: '🗂️', label: 'Work Orders', href: '/shop/home' },
          { ico: '📅', label: 'Calendar', href: '/shop/calendar' },
          { ico: '🏪', label: 'Bays / Waiting Room', href: '/shop/bays' },
          { ico: '🔍', label: 'DVI Inspections', href: '/shop/dvi' },
          { ico: '📝', label: 'Work Authorizations', href: '/shop/work-authorizations' },
          { ico: '🔄', label: 'Recurring Jobs', href: '/shop/recurring-workorders' },
        ],
      },
      {
        title: 'Team & Pay',
        items: [
          { ico: '👥', label: 'Manage Team', href: '/shop/manage-team' },
          { ico: '🕐', label: 'Time Clock', href: '/shop/timeclock' },
          { ico: '💳', label: 'Payroll', href: '/shop/payroll' },
          { ico: '🗓️', label: 'Schedule', href: '/shop/calendar' },
        ],
      },
      {
        title: 'Inventory',
        items: [
          { ico: '🔩', label: 'Inventory', href: '/shop/inventory' },
          { ico: '🛒', label: 'Purchase Orders', href: '/shop/purchase-orders' },
          { ico: '🏭', label: 'Vendors', href: '/shop/vendors' },
        ],
      },
      {
        title: 'Finance',
        items: [
          { ico: '📊', label: 'Reports', href: '/shop/reports' },
          { ico: '📈', label: 'Analytics', href: '/shop/analytics' },
          { ico: '💰', label: 'Profit Margins', href: '/shop/profit-margins' },
        ],
      },
      {
        title: 'Settings',
        items: [
          { ico: '⚙️', label: 'Settings', href: '/shop/settings' },
          { ico: '🏷️', label: 'Branding', href: '/shop/branding' },
          { ico: '🔒', label: 'Profile', href: '/shop/profile' },
        ],
      },
    ],
  },
  tech: {
    accentColor: '#10b981',
    roleLabel: 'Technician',
    ico: '⚙️',
    tiles: [
      { ico: '🗂️', name: 'My Jobs', sub: 'Assigned jobs', href: '/tech/home', color: '#0f1e3a', span2: true },
      { ico: '🔍', name: 'DVI', sub: 'Inspections', href: '/tech/dvi', color: '#0f2214' },
      { ico: '📸', name: 'Photos', sub: 'Upload pics', href: '/tech/photos', color: '#1a0f2e' },
      { ico: '💬', name: 'Messages', sub: 'Shop & customer', href: '/tech/messages', color: '#0f0f2e' },
      { ico: '🧪', name: 'Diagnostics', sub: 'DTC lookup', href: '/tech/dtc-lookup', color: '#111318' },
      { ico: '📖', name: 'Manuals', sub: 'Service specs', href: '/tech/manuals', color: '#0a1e2e' },
      { ico: '🕐', name: 'Time Clock', sub: 'Clock in / out', href: '/tech/timeclock', color: '#2e0f0f' },
      { ico: '🔧', name: 'All Tools', sub: 'Full toolkit', href: '/tech/all-tools', color: '#2e1a0a' },
    ],
    footer: [
      { ico: '🏠', label: 'Home', href: '/tech/home' },
      { ico: '🗂️', label: 'My Jobs', href: '/tech/home' },
      { ico: '💬', label: 'Chat', href: '/tech/messages' },
      { ico: '👤', label: 'Profile', href: '/tech/profile' },
    ],
    newOptions: [
      { ico: '🏪', title: 'In-Shop Job', sub: 'Start new in-shop repair', href: '/tech/new-inshop-job' },
      { ico: '🚐', title: 'Roadside Job', sub: 'Start roadside service call', href: '/tech/new-roadside-job' },
    ],
    drawer: [
      {
        title: 'My Work',
        items: [
          { ico: '🗂️', label: 'My Jobs', href: '/tech/home' },
          { ico: '🔍', label: 'DVI / Inspections', href: '/tech/dvi' },
          { ico: '📸', label: 'Job Photos', href: '/tech/photos' },
          { ico: '🚐', label: 'Roadside Jobs', href: '/tech/new-roadside-job' },
        ],
      },
      {
        title: 'Lookup',
        items: [
          { ico: '🧪', label: 'DTC Lookup', href: '/tech/dtc-lookup' },
          { ico: '📖', label: 'Service Manuals', href: '/tech/manuals' },
          { ico: '🔧', label: 'All Tools', href: '/tech/all-tools' },
          { ico: '📦', label: 'Inventory', href: '/tech/inventory' },
        ],
      },
      {
        title: 'Time',
        items: [
          { ico: '🕐', label: 'Time Clock', href: '/tech/timeclock' },
          { ico: '📋', label: 'My Timesheet', href: '/tech/timesheet' },
          { ico: '📍', label: 'Share Location', href: '/tech/share-location' },
        ],
      },
      {
        title: 'Account',
        items: [
          { ico: '👤', label: 'Profile', href: '/tech/profile' },
          { ico: '⚙️', label: 'Settings', href: '/tech/settings' },
        ],
      },
    ],
  },
  customer: {
    accentColor: '#06b6d4',
    roleLabel: 'Customer',
    ico: '👤',
    tiles: [
      { ico: '🚗', name: 'My Vehicles', sub: 'Your cars', href: '/customer/vehicles', color: '#0f1e3a', span2: true },
      { ico: '🗂️', name: 'Service History', sub: 'Past jobs', href: '/customer/history', color: '#0f2214' },
      { ico: '📅', name: 'Appointments', sub: 'Scheduled visits', href: '/customer/appointments', color: '#1a0f2e' },
      { ico: '💬', name: 'Messages', sub: 'Shop chat', href: '/customer/messages', color: '#0f0f2e' },
      { ico: '💰', name: 'Estimates', sub: 'Pending approval', href: '/customer/estimates', color: '#2e1a0a' },
      { ico: '💳', name: 'Payments', sub: 'Invoices & pay', href: '/customer/payments', color: '#2e0f0f' },
      { ico: '📍', name: 'Find Shops', sub: 'Near me', href: '/customer/findshops', color: '#0a1e2e' },
      { ico: '⭐', name: 'Reviews', sub: 'Leave feedback', href: '/customer/reviews', color: '#2e2a0a' },
    ],
    footer: [
      { ico: '🏠', label: 'Home', href: '/customer/dashboard' },
      { ico: '🗂️', label: 'History', href: '/customer/history' },
      { ico: '💬', label: 'Chat', href: '/customer/messages' },
      { ico: '👤', label: 'Profile', href: '/customer/overview' },
    ],
    newOptions: [
      { ico: '📅', title: 'Book Appointment', sub: 'Schedule at a shop near you', href: '/customer/appointments' },
      { ico: '🔔', title: 'Request Service', sub: 'Send a service request', href: '/customer/findshops' },
    ],
    drawer: [
      {
        title: 'My Cars',
        items: [
          { ico: '🚗', label: 'My Vehicles', href: '/customer/vehicles' },
          { ico: '🗂️', label: 'Service History', href: '/customer/history' },
          { ico: '📋', label: 'Active Work Orders', href: '/customer/workorders' },
        ],
      },
      {
        title: 'Appointments',
        items: [
          { ico: '📅', label: 'Appointments', href: '/customer/appointments' },
          { ico: '🔄', label: 'Recurring Approvals', href: '/customer/recurring-approvals' },
        ],
      },
      {
        title: 'Finances',
        items: [
          { ico: '💰', label: 'Estimates', href: '/customer/estimates' },
          { ico: '💳', label: 'Payments', href: '/customer/payments' },
          { ico: '📄', label: 'Documents', href: '/customer/documents' },
        ],
      },
      {
        title: 'Discover',
        items: [
          { ico: '📍', label: 'Find Shops', href: '/customer/findshops' },
          { ico: '❤️', label: 'Favorites', href: '/customer/favorites' },
          { ico: '🏆', label: 'Rewards', href: '/customer/rewards' },
          { ico: '⭐', label: 'Reviews', href: '/customer/reviews' },
        ],
      },
      {
        title: 'Account',
        items: [
          { ico: '👤', label: 'Profile', href: '/customer/profile' },
          { ico: '🔔', label: 'Notifications', href: '/customer/notifications' },
        ],
      },
    ],
  },
  manager: {
    accentColor: '#8b5cf6',
    roleLabel: 'Manager',
    ico: '📊',
    tiles: [
      { ico: '📋', name: 'Assignments', sub: 'Assign jobs', href: '/manager/assignments', color: '#0f1e3a', span2: true },
      { ico: '✅', name: 'Approvals', sub: 'Pending review', href: '/manager/approvals', color: '#0f2214' },
      { ico: '👥', name: 'Team', sub: 'Staff overview', href: '/manager/team', color: '#1a0f2e' },
      { ico: '💬', name: 'Messages', sub: 'Team & customers', href: '/manager/messages', color: '#0f0f2e' },
      { ico: '📊', name: 'Reports', sub: 'KPIs & metrics', href: '/manager/reports', color: '#0a1e2e' },
      { ico: '🗓️', name: 'Schedule', sub: "Today's shifts", href: '/manager/schedule', color: '#2e1a0a' },
      { ico: '💳', name: 'Payroll', sub: 'Review timesheets', href: '/manager/payroll', color: '#2e0f0f' },
      { ico: '⚙️', name: 'Settings', sub: 'Permissions', href: '/manager/settings', color: '#111318' },
    ],
    footer: [
      { ico: '🏠', label: 'Home', href: '/manager/home' },
      { ico: '📋', label: 'Assign', href: '/manager/assignments' },
      { ico: '💬', label: 'Chat', href: '/manager/messages' },
      { ico: '📊', label: 'Reports', href: '/manager/reports' },
    ],
    newOptions: [
      { ico: '🏪', title: 'In-Shop Job', sub: 'Create new in-shop work order', href: '/shop/new-inshop-job' },
      { ico: '🚐', title: 'Roadside Job', sub: 'Dispatch a roadside job', href: '/tech/new-roadside-job' },
    ],
    drawer: [
      {
        title: 'Operations',
        items: [
          { ico: '📋', label: 'Assignments', href: '/manager/assignments' },
          { ico: '✅', label: 'Approvals', href: '/manager/approvals' },
          { ico: '📝', label: 'Work Authorizations', href: '/manager/work-authorizations' },
          { ico: '🔄', label: 'Recurring Jobs', href: '/manager/recurring-workorders' },
          { ico: '🔍', label: 'Inspections', href: '/manager/inspections' },
        ],
      },
      {
        title: 'Team',
        items: [
          { ico: '👥', label: 'Team', href: '/manager/team' },
          { ico: '🗓️', label: 'Schedule', href: '/manager/schedule' },
          { ico: '🕐', label: 'Time Clock', href: '/manager/timeclock' },
          { ico: '💳', label: 'Payroll', href: '/manager/payroll' },
        ],
      },
      {
        title: 'Reports',
        items: [
          { ico: '📊', label: 'Reports', href: '/manager/reports' },
          { ico: '📋', label: 'Templates', href: '/manager/templates' },
          { ico: '📦', label: 'Inventory', href: '/manager/inventory' },
        ],
      },
      {
        title: 'Settings',
        items: [
          { ico: '⚙️', label: 'Settings', href: '/manager/settings' },
          { ico: '👤', label: 'Profile', href: '/manager/profile' },
        ],
      },
    ],
  },
  admin: {
    accentColor: '#ef4444',
    roleLabel: 'Super Admin',
    ico: '🛡️',
    tiles: [
      { ico: '🏪', name: 'Manage Shops', sub: 'All shops', href: '/superadmin/shops', color: '#0f1e3a', span2: true },
      { ico: '⏳', name: 'Pending Shops', sub: 'Awaiting review', href: '/superadmin/shops/pending', color: '#2e1a0a' },
      { ico: '👥', name: 'Users', sub: 'All accounts', href: '/superadmin/users', color: '#0f2214' },
      { ico: '💰', name: 'Revenue', sub: 'Platform MRR', href: '/superadmin/revenue', color: '#0a1e2e' },
      { ico: '📊', name: 'Analytics', sub: 'Platform-wide', href: '/superadmin/analytics', color: '#1a0f2e' },
      { ico: '🔐', name: 'Security', sub: 'Logs & threats', href: '/superadmin/security', color: '#0f0f2e' },
      { ico: '📧', name: 'Email Templates', sub: 'System emails', href: '/superadmin/email-templates', color: '#2e0f0f' },
      { ico: '⚙️', name: 'System', sub: 'All settings', href: '/admin/settings', color: '#111318' },
    ],
    footer: [
      { ico: '🏠', label: 'Home', href: '/superadmin' },
      { ico: '🏪', label: 'Shops', href: '/superadmin/shops' },
      { ico: '💬', label: 'Chat', href: '/superadmin' },
      { ico: '⚙️', label: 'System', href: '/admin/settings' },
    ],
    newOptions: [
      { ico: '🏪', title: 'Add Shop', sub: 'Manually register a new shop', href: '/superadmin/shops' },
      { ico: '👤', title: 'Add User', sub: 'Create new admin or user', href: '/superadmin/users' },
    ],
    drawer: [
      {
        title: 'Shops',
        items: [
          { ico: '🏪', label: 'Manage Shops', href: '/superadmin/shops' },
          { ico: '⏳', label: 'Pending Shops', href: '/superadmin/shops/pending' },
          { ico: '📋', label: 'Subscriptions', href: '/superadmin/subscriptions' },
        ],
      },
      {
        title: 'Users',
        items: [
          { ico: '👥', label: 'User Management', href: '/superadmin/users' },
          { ico: '👤', label: 'Customers', href: '/superadmin/customers' },
        ],
      },
      {
        title: 'Finance',
        items: [
          { ico: '💰', label: 'Revenue', href: '/superadmin/revenue' },
          { ico: '📊', label: 'Analytics', href: '/superadmin/analytics' },
        ],
      },
      {
        title: 'Platform',
        items: [
          { ico: '🔐', label: 'Security', href: '/superadmin/security' },
          { ico: '📋', label: 'Activity Logs', href: '/superadmin/activity-logs' },
          { ico: '📧', label: 'Email Templates', href: '/superadmin/email-templates' },
          { ico: '⚙️', label: 'System Settings', href: '/admin/settings' },
        ],
      },
    ],
  },
};

// ---------------------------------------------------------------------------
// Shell props
// ---------------------------------------------------------------------------
interface MobileShellProps {
  role: ShellRole;
  userName?: string;
  /** Show the home tile-grid instead of children */
  isHome?: boolean;
  /** Title shown in header when not on home */
  sectionTitle?: string;
  /** Page content (shown in section views, ignored when isHome=true) */
  children?: ReactNode;
  unreadMessages?: number;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function MobileShell({
  role,
  userName,
  isHome = false,
  sectionTitle,
  children,
  unreadMessages = 0,
}: MobileShellProps) {
  const isNative = useIsNative();
  const router = useRouter();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [newMenuOpen, setNewMenuOpen] = useState(false);

  // Close overlays on route change
  useEffect(() => {
    setDrawerOpen(false);
    setNewMenuOpen(false);
  }, [pathname]);

  // Only render the shell when running inside the native app.
  // On web/desktop always pass through children.
  if (!isNative) return <>{children}</>;

  const cfg = ROLES[role];
  const accent = cfg.accentColor;

  const isActivePath = (href: string) =>
    href === pathname || (href !== '/' && (pathname ?? '').startsWith(href + '/'));

  const go = (href: string) => router.push(href as Route);

  const signOut = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userName');
      localStorage.removeItem('shopId');
      localStorage.removeItem('userId');
      window.location.href = '/auth/login';
    }
  };

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'linear-gradient(160deg,#060709 0%,#0b0d14 100%)',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
      fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif',
      zIndex: 0,
      color: '#e2e8f0',
    }}>

      {/* ─── STATUS BAR ─────────────────────────────────────────── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '10px 18px 2px',
        fontSize: 10, fontWeight: 700, color: '#fff',
        flexShrink: 0,
      }}>
        <span>9:41</span>
        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
          <span>●●●</span>
          <div style={{
            width: 18, height: 9, border: '1.5px solid rgba(255,255,255,0.5)',
            borderRadius: 2, padding: 1, position: 'relative',
          }}>
            <div style={{ height: '100%', width: '70%', background: '#22c55e', borderRadius: 1 }} />
            <div style={{
              position: 'absolute', right: -4, top: 1.5,
              width: 2.5, height: 5, background: 'rgba(255,255,255,0.5)',
              borderRadius: 1,
            }} />
          </div>
        </div>
      </div>

      {/* ─── APP HEADER ─────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '6px 14px 8px',
        background: 'rgba(6,7,9,0.95)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        flexShrink: 0,
        zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Wrench (drawer) on home; back arrow on sections */}
          <button
            onClick={() => isHome ? setDrawerOpen(true) : router.back()}
            style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 17, cursor: 'pointer', color: '#fff',
              flexShrink: 0,
            }}
          >
            {isHome ? '🔧' : '←'}
          </button>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, lineHeight: 1.2 }}>
              {isHome ? 'FixTray' : (sectionTitle || 'FixTray')}
            </div>
            {isHome && (
              <div style={{ fontSize: 9, color: '#718096', marginTop: 1 }}>{cfg.roleLabel}</div>
            )}
          </div>
        </div>

        {/* Avatar */}
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: accent + '22',
          border: `1.5px solid ${accent}55`,
          color: accent,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 15, fontWeight: 800,
        }}>
          {cfg.ico}
        </div>
      </div>

      {/* ─── CONTENT AREA ────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', paddingBottom: 76 }}>
        {isHome ? <TileGrid cfg={cfg} accent={accent} onTile={go} /> : children}
      </div>

      {/* ─── FOOTER NAV ──────────────────────────────────────────── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'rgba(6,7,9,0.97)',
        backdropFilter: 'blur(24px)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '6px 4px 18px',
        display: 'flex', alignItems: 'flex-end',
        zIndex: 40,
      }}>
        {/* Item 1 */}
        <FooterBtn item={cfg.footer[0]} isActive={isActivePath(cfg.footer[0].href)} onClick={() => go(cfg.footer[0].href)} />
        {/* Item 2 */}
        <FooterBtn
          item={{ ...cfg.footer[1], badge: cfg.footer[1].label === 'Chat' ? (unreadMessages || undefined) : cfg.footer[1].badge }}
          isActive={isActivePath(cfg.footer[1].href)}
          onClick={() => go(cfg.footer[1].href)}
        />
        {/* CENTER FAB */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
          <button
            onClick={() => setNewMenuOpen(!newMenuOpen)}
            style={{
              width: 54, height: 54, borderRadius: '50%',
              background: accent,
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, color: '#fff',
              marginTop: -22,
              boxShadow: `0 4px 20px ${accent}88`,
              transition: 'transform 0.2s, box-shadow 0.2s',
              transform: newMenuOpen ? 'rotate(45deg)' : 'rotate(0deg)',
            }}
          >＋</button>
          <span style={{ fontSize: 9, fontWeight: 600, color: '#4a5568', marginTop: 3 }}>New</span>

          {/* New submenu */}
          {newMenuOpen && (
            <div style={{
              position: 'absolute', bottom: '110%', left: '50%',
              transform: 'translateX(-50%)',
              background: '#13161f',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 18, padding: 12, width: 210,
              boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
              zIndex: 100,
            }}>
              <div style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#4a5568', textAlign: 'center', marginBottom: 10 }}>
                Create New
              </div>
              {cfg.newOptions.map((opt) => (
                <button
                  key={opt.href}
                  onClick={() => { setNewMenuOpen(false); go(opt.href); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 12, padding: '12px 14px',
                    marginBottom: 7, width: '100%', cursor: 'pointer',
                    color: '#e2e8f0', textAlign: 'left',
                  }}
                >
                  <span style={{ fontSize: 22 }}>{opt.ico}</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>{opt.title}</div>
                    <div style={{ fontSize: 10, color: '#718096', marginTop: 1 }}>{opt.sub}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        {/* Item 3 */}
        <FooterBtn
          item={{ ...cfg.footer[2], badge: cfg.footer[2].label === 'Chat' ? (unreadMessages || undefined) : cfg.footer[2].badge }}
          isActive={isActivePath(cfg.footer[2].href)}
          onClick={() => go(cfg.footer[2].href)}
        />
        {/* Item 4 */}
        <FooterBtn item={cfg.footer[3]} isActive={isActivePath(cfg.footer[3].href)} onClick={() => go(cfg.footer[3].href)} />
      </div>

      {/* ─── DIM overlay (new menu) ───────────────────────────────── */}
      {newMenuOpen && (
        <div
          onClick={() => setNewMenuOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
            zIndex: 39,
          }}
        />
      )}

      {/* ─── DRAWER ──────────────────────────────────────────────── */}
      {drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 150 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute', top: 0, left: 0, bottom: 0,
              width: 260,
              background: '#0d0f16',
              borderRight: '1px solid rgba(255,255,255,0.07)',
              display: 'flex', flexDirection: 'column',
              animation: 'mobileShellDrawerIn 0.25s ease',
              overflowY: 'auto',
            }}
          >
            {/* Drawer head */}
            <div style={{ padding: '44px 16px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%',
                background: accent + '22', border: `1.5px solid ${accent}55`, color: accent,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, marginBottom: 8,
              }}>{cfg.ico}</div>
              <div style={{ fontSize: 14, fontWeight: 800 }}>{userName || cfg.roleLabel}</div>
              <div style={{ fontSize: 10, color: '#718096', marginTop: 2 }}>{cfg.roleLabel}</div>
            </div>

            {/* Drawer sections */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
              {cfg.drawer.map((sec) => (
                <div key={sec.title}>
                  <div style={{
                    fontSize: 9, fontWeight: 800, textTransform: 'uppercase',
                    letterSpacing: '0.09em', color: '#4a5568',
                    padding: '10px 16px 4px',
                  }}>{sec.title}</div>
                  {sec.items.map((item) => (
                    <button
                      key={item.href + item.label}
                      onClick={() => { setDrawerOpen(false); go(item.href); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '9px 12px', cursor: 'pointer',
                        fontSize: 12, fontWeight: 500, color: '#e2e8f0',
                        background: isActivePath(item.href) ? 'rgba(255,255,255,0.07)' : 'transparent',
                        border: 'none', textAlign: 'left',
                        borderRadius: 8, margin: '1px 6px', boxSizing: 'border-box',
                        width: 'calc(100% - 12px)',
                      }}
                    >
                      <span style={{ fontSize: 14, width: 20, textAlign: 'center', flexShrink: 0 }}>{item.ico}</span>
                      <span style={{ flex: 1 }}>{item.label}</span>
                      {item.badge != null && (
                        <span style={{
                          background: '#ef4444', color: '#fff', fontSize: 9, fontWeight: 800,
                          borderRadius: 8, padding: '1px 5px',
                        }}>{item.badge}</span>
                      )}
                    </button>
                  ))}
                </div>
              ))}
            </div>

            {/* Sign out */}
            <div style={{ padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
              <button
                onClick={signOut}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  fontSize: 12, color: '#f87171', cursor: 'pointer',
                  background: 'transparent', border: 'none', padding: '8px 6px',
                  borderRadius: 8, width: '100%', textAlign: 'left',
                }}
              >🚪 Sign Out</button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes mobileShellDrawerIn{from{transform:translateX(-100%)}to{transform:translateX(0)}}`}</style>
    </div>
  );
}

// ---------------------------------------------------------------------------
// TileGrid
// ---------------------------------------------------------------------------
function TileGrid({ cfg, accent, onTile }: { cfg: RoleConfig; accent: string; onTile: (href: string) => void }) {
  return (
    <div style={{ padding: '10px 12px 0' }}>
      <div style={{
        fontSize: 9, fontWeight: 800, textTransform: 'uppercase',
        letterSpacing: '0.1em', color: '#4a5568', marginBottom: 8,
      }}>Quick Access</div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 8,
      }}>
        {cfg.tiles.map((tile) => (
          <button
            key={tile.href}
            onClick={() => onTile(tile.href)}
            style={{
              gridColumn: tile.span2 ? 'span 2' : undefined,
              background: tile.color,
              border: '1px solid rgba(255,255,255,0.04)',
              borderRadius: 16,
              padding: tile.span2 ? '14px 16px' : '14px 12px 12px',
              minHeight: tile.span2 ? 72 : 94,
              display: 'flex',
              flexDirection: tile.span2 ? 'row' : 'column',
              alignItems: tile.span2 ? 'center' : 'flex-start',
              gap: tile.span2 ? 14 : 0,
              justifyContent: tile.span2 ? undefined : 'space-between',
              cursor: 'pointer',
              position: 'relative',
              textAlign: 'left',
              transition: 'filter 0.15s, transform 0.15s',
              color: '#fff',
            }}
          >
            {tile.badge != null && (
              <div style={{
                position: 'absolute', top: 8, right: 8,
                background: '#ef4444', color: '#fff',
                borderRadius: 10, fontSize: 9, fontWeight: 800,
                padding: '1px 6px', minWidth: 16, textAlign: 'center',
                border: '1.5px solid rgba(0,0,0,0.3)',
              }}>{tile.badge}</div>
            )}
            <div style={{ fontSize: tile.span2 ? 22 : 24, marginBottom: tile.span2 ? 0 : 8 }}>{tile.ico}</div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#fff', lineHeight: 1.3 }}>{tile.name}</div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{tile.sub}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// FooterBtn
// ---------------------------------------------------------------------------
function FooterBtn({
  item, isActive, onClick,
}: {
  item: FooterItem;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
        fontSize: 9, fontWeight: 600,
        color: isActive ? '#fff' : '#4a5568',
        cursor: 'pointer', padding: '4px 2px',
        background: 'transparent', border: 'none',
        position: 'relative',
      }}
    >
      {isActive && (
        <div style={{
          position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: 4, height: 4, borderRadius: '50%',
          background: 'currentColor',
        }} />
      )}
      <span style={{ fontSize: 21, transform: isActive ? 'scale(1.1)' : 'none' }}>{item.ico}</span>
      <span>{item.label}</span>
      {item.badge != null && Number(item.badge) > 0 && (
        <div style={{
          position: 'absolute', top: 1, right: 'calc(50% - 18px)',
          background: '#ef4444', color: '#fff',
          width: 14, height: 14, borderRadius: '50%',
          fontSize: 7, fontWeight: 800,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1.5px solid #060709',
        }}>{item.badge}</div>
      )}
    </button>
  );
}
