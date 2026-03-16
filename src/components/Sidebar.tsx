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

interface MenuGroup {
  label: string;
  icon: string;
  items: MenuItem[];
  defaultOpen?: boolean;
}

interface SidebarProps {
  role: 'shop' | 'manager' | 'tech';
  isOpen?: boolean;
  onClose?: () => void;
  onSelectTab?: (tab: string) => void;
  activeHash?: string;
}

// ─── GROUP DEFINITIONS ───────────────────────────────────────────────────────

const shopGroups: MenuGroup[] = [
  {
    label: 'Overview',
    icon: '📊',
    defaultOpen: true,
    items: [
      { icon: '🏠', label: 'Dashboard',  href: '/shop/admin' },
      { icon: '🏪', label: 'Shop Home',  href: '/shop/home' },
      { icon: '💬', label: 'Messages',   href: '/shop/customer-messages' },
    ],
  },
  {
    label: 'Work Orders',
    icon: '📋',
    defaultOpen: true,
    items: [
      { icon: '🗂',  label: 'All Orders',       href: '/workorders/list' },
      { icon: '🏭',  label: 'In-Shop Jobs',      href: '/workorders/inshop' },
      { icon: '✍️',  label: 'Authorizations',    href: '/shop/work-authorizations' },
      { icon: '📝',  label: 'Templates',          href: '/shop/templates' },
      { icon: '🔄',  label: 'Recurring',          href: '/shop/recurring-workorders' },
      { icon: '📺',  label: 'Waiting Room',       href: '/shop/waiting-room' },
    ],
  },
  {
    label: 'Team & Payroll',
    icon: '👥',
    defaultOpen: false,
    items: [
      { icon: '👥', label: 'Manage Team',  href: '/shop/manage-team' },
      { icon: '🔐', label: 'Permissions',  href: '/shop/settings/permissions' },
      { icon: '💰', label: 'Payroll',      href: '/shop/payroll' },
      { icon: '⏰', label: 'Time Clock',   href: '/shop/admin#timeclock' },
      { icon: '🗓️', label: 'Schedule',     href: '/shop/settings/schedule' },
    ]
  },
  {
    label: 'Inventory & Parts',
    icon: '📦',
    defaultOpen: false,
    items: [
      { icon: '📦', label: 'Inventory',       href: '/shop/inventory' },
      { icon: '🔄', label: 'Shared Inventory', href: '/shop/inventory/shared' },
      { icon: '🏭', label: 'Vendors',         href: '/shop/vendors' },
      { icon: '🛒', label: 'Purchase Orders', href: '/shop/purchase-orders' },
      { icon: '♻️', label: 'Core Returns',    href: '/shop/core-returns' },
    ],
  },
  {
    label: 'Vehicle Services',
    icon: '🚗',
    defaultOpen: false,
    items: [
      { icon: '🛠️', label: 'Services',            href: '/shop/services' },
      { icon: '🚗', label: 'Bay Board',            href: '/shop/bays' },
      { icon: '🚙', label: 'Loaners',              href: '/shop/loaners' },
      { icon: '🏢', label: 'Fleet Accounts',       href: '/shop/fleet' },
      { icon: '🔍', label: 'DVI Inspections',      href: '/shop/dvi' },
      { icon: '📸', label: 'Condition Reports',    href: '/shop/condition-reports' },
      { icon: '🚘', label: 'State Inspections',    href: '/shop/inspections' },
      { icon: '🌿', label: 'Environmental Fees',   href: '/shop/environmental-fees' },
    ],
  },
  {
    label: 'Financials',
    icon: '💹',
    defaultOpen: false,
    items: [
      { icon: '📈', label: 'Reports',           href: '/shop/reports' },
      { icon: '📋', label: 'EOD Report',          href: '/shop/eod-report' },
      { icon: '⏱️', label: 'SLA Metrics',        href: '/shop/analytics/sla' },
      { icon: '👷', label: 'Employee Perf',      href: '/shop/analytics/performance' },
      { icon: '👤', label: 'Customer CRM',      href: '/shop/customer-reports' },
      { icon: '📊', label: 'AR Aging',           href: '/shop/ar-aging' },
      { icon: '💹', label: 'Profit Margins',     href: '/shop/profit-margins' },
      { icon: '💳', label: 'Payment Links',      href: '/shop/payment-links' },
      { icon: '⭐', label: 'Reviews',            href: '/shop/reviews' },
    ],
  },
  {
    label: 'Growth',
    icon: '🎯',
    defaultOpen: false,
    items: [
      { icon: '🎁', label: 'Referrals',    href: '/shop/referrals' },
      { icon: '📢', label: 'Campaigns',    href: '/shop/campaigns' },
      { icon: '🎨', label: 'Branding',     href: '/shop/branding' },
      { icon: '🔌', label: 'Integrations', href: '/shop/integrations' },
      { icon: '⚡', label: 'Automations',  href: '/shop/automations' },
      { icon: '📍', label: 'Locations',    href: '/shop/locations' },
    ],
  },
  {
    label: 'Settings',
    icon: '⚙️',
    defaultOpen: false,
    items: [
      { icon: '⚙️', label: 'Shop Settings',   href: '/shop/settings' },
      { icon: '🔧', label: 'Admin Panel',     href: '/shop/admin/settings' },
      { icon: '📜', label: 'Audit Logs',      href: '/shop/admin/logs' },
      { icon: '🧾', label: 'Tax Settings',    href: '/shop/tax-settings' },
      { icon: '🔐', label: 'Two-Factor Auth', href: '/shop/settings/two-factor' },
      { icon: '🔑', label: 'API Keys',        href: '/shop/settings/api-keys' },
      { icon: '🪝', label: 'Webhooks',        href: '/shop/settings/webhooks' },
      { icon: '🖥️', label: 'Sessions',        href: '/shop/settings/sessions' },
      { icon: '🩺', label: 'Health Check',    href: '/shop/admin/health' },
    ],
  },
];

const managerGroups: MenuGroup[] = [
  {
    label: 'Overview',
    icon: '🏠',
    defaultOpen: true,
    items: [
      { icon: '🏠', label: 'Dashboard',   href: '/manager/home' },
      { icon: '📊', label: 'Reports',     href: '/manager/dashboard' },
      { icon: '💬', label: 'Messages',    href: '/manager/home#messages' },
    ]
  },
  {
    label: 'Work Orders',
    icon: '📋',
    defaultOpen: true,
    items: [
      { icon: '🗂',  label: 'All Orders',   href: '/workorders/list' },
      { icon: '📋',  label: 'Assignments',  href: '/manager/assignments' },
      { icon: '📝',  label: 'Estimates',    href: '/manager/estimates' },
    ],
  },
  {
    label: 'Team',
    icon: '👥',
    defaultOpen: true,
    items: [
      { icon: '👥', label: 'Team Overview', href: '/manager/team' },
    ],
  },
  {
    label: 'Tools',
    icon: '🔧',
    defaultOpen: false,
    items: [
      { icon: '⏰', label: 'Time Clock',   href: '/manager/home#timeclock' },
      { icon: '📦', label: 'Inventory',    href: '/manager/home#inventory' },
    ],
  },
];

const techGroups: MenuGroup[] = [
  {
    label: 'Overview',
    icon: '🏠',
    defaultOpen: true,
    items: [
      { icon: '🏠', label: 'Home',      href: '/tech/home' },
      { icon: '📋', label: 'My Jobs',   href: '/tech/home#jobs' },
      { icon: '💬', label: 'Messages',  href: '/tech/messages' },
    ],
  },
  {
    label: 'Time & Jobs',
    icon: '⏰',
    defaultOpen: true,
    items: [
      { icon: '⏰', label: 'Time Clock',       href: '/tech/home#timeclock' },
      { icon: '🗂',  label: 'All Work Orders',  href: '/workorders/list' },
      { icon: '🏭',  label: 'New In-Shop Job',  href: '/tech/new-inshop-job' },
      { icon: '🛣️',  label: 'New Roadside Job', href: '/tech/new-roadside-job' },
    ],
  },
  {
    label: 'Tools',
    icon: '🔧',
    defaultOpen: false,
    items: [
      { icon: '🔧', label: 'All Tools',      href: '/tech/all-tools' },
      { icon: '🔍', label: 'DVI Form',       href: '/tech/dvi' },
      { icon: '🔎', label: 'DTC Lookup',     href: '/tech/dtc-lookup' },
      { icon: '📸', label: 'Photos',         href: '/tech/photos' },
      { icon: '📦', label: 'Inventory',      href: '/tech/inventory' },
      { icon: '📍', label: 'Share Location', href: '/tech/share-location' },
      { icon: '🔐', label: 'Two-Factor Auth', href: '/tech/settings/two-factor' },
    ],
  },
];

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export default function Sidebar({ role, isOpen = true, onClose, onSelectTab, activeHash }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [currentHash, setCurrentHash] = useState('');

  const groups = role === 'shop' ? shopGroups : role === 'manager' ? managerGroups : techGroups;

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(groups.map(g => [g.label, g.defaultOpen ?? false]))
  );

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
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

  const isActive = (href: string) => {
    if (href.includes('#')) {
      const [base, hash] = href.split('#');
      const hashValue = activeHash || currentHash;
      return pathname === base && hashValue === `#${hash}`;
    }
    return pathname === href || (href !== '/' && (pathname ?? '').startsWith(href + '/'));
  };

  const toggleGroup = (label: string) => {
    if (collapsed) return;
    setOpenGroups(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const handleItemClick = (e: React.MouseEvent, href: string) => {
    if (onSelectTab && href.includes('#')) {
      const [, hash] = href.split('#');
      if (hash) {
        e.preventDefault();
        onSelectTab(hash);
        setCurrentHash(`#${hash}`);
      }
    }
    if (isMobile && onClose) onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Mobile backdrop */}
      {isMobile && isOpen && onClose && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.55)', zIndex: 998,
          }}
        />
      )}

      <aside style={{
        width: collapsed ? 58 : 230,
        minWidth: collapsed ? 58 : 230,
        height: '100vh',
        background: 'rgba(8, 12, 24, 0.82)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(255,255,255,0.07)',
        position: isMobile ? 'fixed' : 'sticky',
        top: 0,
        left: isMobile && !isOpen ? -230 : 0,
        transition: 'width 0.22s cubic-bezier(.4,0,.2,1), min-width 0.22s cubic-bezier(.4,0,.2,1)',
        overflowY: 'auto',
        overflowX: 'hidden',
        zIndex: 999,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif",
      }}>

        {/* Header */}
        <div style={{
          padding: collapsed ? '16px 0' : '16px 14px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          gap: 8,
          flexShrink: 0,
          minHeight: 54,
        }}>
          {!collapsed && (
            <div style={{
              fontSize: 16,
              fontWeight: 800,
              color: '#e5332a',
              letterSpacing: '-0.5px',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}>
              FixTray
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#475569',
              width: 26, height: 26,
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              transition: 'color 0.15s, border-color 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#475569'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? '→' : '←'}
          </button>
        </div>

        {/* Nav Groups */}
        <nav style={{ flex: 1, padding: '8px 0', overflowY: 'auto' }}>
          {groups.map((group) => {
            const isGroupOpen = collapsed ? false : (openGroups[group.label] ?? group.defaultOpen);
            const hasActiveItem = group.items.some(item => isActive(item.href));

            return (
              <div key={group.label} style={{ marginBottom: 2 }}>
                {/* Group header */}
                <button
                  onClick={() => toggleGroup(group.label)}
                  title={collapsed ? group.label : undefined}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: collapsed ? '10px 0' : '8px 14px',
                    background: 'transparent',
                    border: 'none',
                    cursor: collapsed ? 'default' : 'pointer',
                    borderLeft: hasActiveItem ? '2px solid rgba(229,51,42,0.6)' : '2px solid transparent',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                  }}
                >
                  {collapsed && <span style={{ fontSize: 15, flexShrink: 0 }}>{group.icon}</span>}
                  {!collapsed && (
                    <>
                      <span style={{
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: '0.09em',
                        textTransform: 'uppercase',
                        color: hasActiveItem ? '#e5332a' : '#334155',
                        flex: 1,
                        textAlign: 'left',
                      }}>
                        {group.label}
                      </span>
                      <span style={{
                        color: '#334155',
                        fontSize: 9,
                        transition: 'transform 0.2s',
                        transform: isGroupOpen ? 'rotate(180deg)' : 'none',
                      }}>▼</span>
                    </>
                  )}
                </button>

                {/* Expanded items */}
                {isGroupOpen && !collapsed && (
                  <div style={{ paddingBottom: 4 }}>
                    {group.items.map((item, idx) => {
                      const active = isActive(item.href);
                      return (
                        <Link
                          key={idx}
                          href={item.href}
                          onClick={(e) => handleItemClick(e, item.href)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 9,
                            padding: '7px 14px 7px 26px',
                            textDecoration: 'none',
                            background: active ? 'rgba(229,51,42,0.10)' : 'transparent',
                            borderLeft: active ? '2px solid #e5332a' : '2px solid transparent',
                            color: active ? '#f1f5f9' : '#64748b',
                            fontSize: 12.5,
                            fontWeight: active ? 600 : 400,
                            letterSpacing: '0.01em',
                            transition: 'color 0.12s, background 0.12s',
                          }}
                          onMouseEnter={(e) => {
                            if (!active) {
                              e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                              e.currentTarget.style.color = '#cbd5e1';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!active) {
                              e.currentTarget.style.background = 'transparent';
                              e.currentTarget.style.color = '#64748b';
                            }
                          }}
                        >
                          <span style={{ fontSize: 13, flexShrink: 0, opacity: active ? 1 : 0.65 }}>{item.icon}</span>
                          <span style={{ flex: 1 }}>{item.label}</span>
                          {item.badge && item.badge > 0 && (
                            <span style={{
                              background: '#e5332a', color: 'white',
                              borderRadius: 999, padding: '1px 6px',
                              fontSize: 10, fontWeight: 700,
                            }}>
                              {item.badge > 9 ? '9+' : item.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}

                {/* Collapsed: icon-only items */}
                {collapsed && (
                  <div style={{ paddingBottom: 2 }}>
                    {group.items.map((item, idx) => {
                      const active = isActive(item.href);
                      return (
                        <Link
                          key={idx}
                          href={item.href}
                          onClick={(e) => handleItemClick(e, item.href)}
                          title={item.label}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '8px 0',
                            textDecoration: 'none',
                            background: active ? 'rgba(229,51,42,0.15)' : 'transparent',
                            borderLeft: active ? '2px solid #e5332a' : '2px solid transparent',
                            color: active ? '#f87171' : '#6b7280',
                            fontSize: 15,
                            transition: 'all 0.15s',
                          }}
                          onMouseEnter={(e) => {
                            if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                          }}
                          onMouseLeave={(e) => {
                            if (!active) e.currentTarget.style.background = 'transparent';
                          }}
                        >
                          {item.icon}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        {!collapsed && (
          <div style={{
            padding: '10px 14px',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            flexShrink: 0,
          }}>
            <div style={{ fontSize: 10, color: '#1e293b', textAlign: 'center', letterSpacing: '0.08em', fontWeight: 600, textTransform: 'uppercase' }}>
              FixTray · v1.0
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
