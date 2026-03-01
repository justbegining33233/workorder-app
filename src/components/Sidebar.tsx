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
      { icon: '💰', label: 'Payroll',      href: '/shop/payroll' },
      { icon: '⏰', label: 'Time Clock',   href: '/shop/admin#timeclock' },
      { icon: '🗓️', label: 'Schedule',     href: '/shop/settings/schedule' },
    ],
  },
  {
    label: 'Inventory & Parts',
    icon: '📦',
    defaultOpen: false,
    items: [
      { icon: '📦', label: 'Inventory',       href: '/shop/inventory' },
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
      { icon: '📈', label: 'Reports',        href: '/shop/reports' },
      { icon: '👤', label: 'Customer Data',  href: '/shop/customer-reports' },
      { icon: '📊', label: 'AR Aging',       href: '/shop/ar-aging' },
      { icon: '💹', label: 'Profit Margins', href: '/shop/profit-margins' },
      { icon: '⭐', label: 'Reviews',        href: '/shop/reviews' },
    ],
  },
  {
    label: 'Growth',
    icon: '🎯',
    defaultOpen: false,
    items: [
      { icon: '🎁', label: 'Referrals',    href: '/shop/referrals' },
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
      { icon: '🧾', label: 'Tax Settings',    href: '/shop/tax-settings' },
      { icon: '🔐', label: 'Two-Factor Auth', href: '/shop/settings/two-factor' },
    ],
  },
];

const managerGroups: MenuGroup[] = [
  {
    label: 'Overview',
    icon: '🏠',
    defaultOpen: true,
    items: [
      { icon: '🏠', label: 'Home',      href: '/manager/home' },
      { icon: '💬', label: 'Messages',  href: '/manager/home#messages' },
    ],
  },
  {
    label: 'Work & Team',
    icon: '📋',
    defaultOpen: true,
    items: [
      { icon: '🗂',  label: 'Work Orders',  href: '/workorders/list' },
      { icon: '📋',  label: 'Assignments',  href: '/manager/assignments' },
      { icon: '👥',  label: 'View Team',    href: '/shop/manage-team' },
      { icon: '📝',  label: 'Estimates',    href: '/manager/estimates' },
    ],
  },
  {
    label: 'Tools',
    icon: '🔧',
    defaultOpen: false,
    items: [
      { icon: '⏰', label: 'Time Clock',  href: '/manager/home#timeclock' },
      { icon: '📦', label: 'Inventory',   href: '/manager/home#inventory' },
      { icon: '🔧', label: 'All Tools',   href: '/tech/all-tools' },
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
        width: collapsed ? 64 : 236,
        minWidth: collapsed ? 64 : 236,
        height: '100vh',
        background: 'linear-gradient(180deg, #1a2234 0%, #0f172a 100%)',
        borderRight: '1px solid rgba(229,51,42,0.18)',
        position: isMobile ? 'fixed' : 'sticky',
        top: 0,
        left: isMobile && !isOpen ? -236 : 0,
        transition: 'width 0.25s ease, min-width 0.25s ease',
        overflowY: 'auto',
        overflowX: 'hidden',
        zIndex: 999,
        display: 'flex',
        flexDirection: 'column',
      }}>

        {/* Header */}
        <div style={{
          padding: '14px 12px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          gap: 8,
          flexShrink: 0,
        }}>
          {!collapsed && (
            <div style={{ fontSize: 15, fontWeight: 700, color: '#e5332a', letterSpacing: '-0.3px' }}>
              FixTray
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#9ca3af',
              width: 28, height: 28,
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 13,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
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
                    padding: collapsed ? '10px 0' : '7px 12px',
                    background: hasActiveItem ? 'rgba(229,51,42,0.08)' : 'transparent',
                    border: 'none',
                    cursor: collapsed ? 'default' : 'pointer',
                    borderLeft: hasActiveItem ? '2px solid rgba(229,51,42,0.5)' : '2px solid transparent',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    transition: 'background 0.15s',
                  }}
                >
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{group.icon}</span>
                  {!collapsed && (
                    <>
                      <span style={{
                        fontSize: 11,
                        fontWeight: 600,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        color: hasActiveItem ? '#e5332a' : '#6b7280',
                        flex: 1,
                        textAlign: 'left',
                      }}>
                        {group.label}
                      </span>
                      <span style={{
                        color: '#4b5563',
                        fontSize: 10,
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
                            gap: 10,
                            padding: '8px 12px 8px 28px',
                            textDecoration: 'none',
                            background: active ? 'rgba(229,51,42,0.15)' : 'transparent',
                            borderLeft: active ? '2px solid #e5332a' : '2px solid transparent',
                            color: active ? '#f87171' : '#9ca3af',
                            fontSize: 13,
                            fontWeight: active ? 600 : 400,
                            transition: 'all 0.15s',
                          }}
                          onMouseEnter={(e) => {
                            if (!active) {
                              e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                              e.currentTarget.style.color = '#d1d5db';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!active) {
                              e.currentTarget.style.background = 'transparent';
                              e.currentTarget.style.color = '#9ca3af';
                            }
                          }}
                        >
                          <span style={{ fontSize: 14, flexShrink: 0 }}>{item.icon}</span>
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
            padding: '10px 12px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            flexShrink: 0,
          }}>
            <div style={{ fontSize: 10, color: '#374151', textAlign: 'center', letterSpacing: '0.05em' }}>
              FIXTRAY · v1.0
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
