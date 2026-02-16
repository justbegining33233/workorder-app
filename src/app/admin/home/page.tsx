'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useRequireAuth, useAuth } from '@/contexts/AuthContext';
import { DashboardTab } from './components/DashboardTabClean';
import { SubscriptionsTab } from './components/SubscriptionsTab';
import { UsersTab } from './components/UsersTab';
import { HierarchyTab } from './components/HierarchyTab';
import { useAdminData } from './hooks/useAdminData';

export const dynamic = 'force-dynamic';

function AdminHomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading } = useRequireAuth(['admin']);
  const isSuperAdmin = user?.isSuperAdmin;
  const [activeSection, setActiveSection] = useState('dashboard');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  const {
    platformStats,
    subscriptions,
    allUsers,
    pendingShops,
    approvedShops,
    recentActivity,
    planDistribution,
    weeklyOverview,
    threeMonthAverages,
    liveMetrics,
    usersLiveMetrics,
    shopsLiveMetrics,
    dataLoaded
  } = useAdminData();

  const { logout } = useAuth();

  const handleSignOut = () => {
    // Use shared auth logout to clear state and navigate
    logout();
  };

  const handleSectionSelect = (sectionId: string) => {
    setActiveSection(sectionId);
    setSearchOpen(false);

    // Keep URL in sync so only one active tab persists on refresh/back
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      params.set('section', sectionId);
      router.replace(`?${params.toString()}`, { scroll: false });
    }
  };

  // Sync active section from query param so only one item is ever highlighted
  useEffect(() => {
    const sectionFromUrl = searchParams?.get('section');
    if (sectionFromUrl && sectionFromUrl !== activeSection) {
      setActiveSection(sectionFromUrl);
    }
  }, [searchParams, activeSection]);

  // Super admins land on this home dashboard (left menu, cards)
  useEffect(() => {
    // No redirect; this is the target dashboard
  }, [isSuperAdmin, router]);

  // Keyboard shortcut for search (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center">
        <div className="space-y-3 w-48">
          <div className="h-2 bg-[#27272A] rounded animate-pulse" />
          <div className="h-2 bg-[#27272A] rounded animate-pulse w-3/4" />
          <div className="h-2 bg-[#27272A] rounded animate-pulse w-1/2" />
        </div>
      </div>
    );
  }

  // While redirecting super admins, avoid rendering this dashboard to prevent flicker or hook order noise
  // Render dashboard for super admins as well

  if (!user) {
    return (
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center">
        <div className="bg-[#18181B] border border-[#27272A] rounded-lg p-6 text-center">
          <div className="w-10 h-10 bg-[#27272A] rounded-md flex items-center justify-center mx-auto mb-3">
            <svg className="w-5 h-5 text-[#52525B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <p className="text-[#71717A] text-[13px]">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // Navigation organized by category for better UX
  const navigationItems = [
    // Overview & Analytics
    { id: 'dashboard', label: 'Overview', icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z', category: 'main' },
    // Revenue & Growth
    { id: 'subscriptions', label: 'Revenue', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', badge: subscriptions.length, category: 'business' },
    // Customer & Users Management
    { id: 'users', label: 'Customers', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', badge: allUsers.length, category: 'business' },
    // Shops & Organizations
    { id: 'hierarchy', label: 'Shops', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4', badge: approvedShops.length, category: 'business' },
  ];

  const quickLinks = [
    { href: '/admin/command-center', label: '🎛️ Command Center', icon: 'command', highlight: true },
    { href: '/admin/revenue', label: '💰 Revenue & Payouts', icon: 'money' },
    { href: '/admin/pending-shops', label: 'Pending Approvals', badge: pendingShops.length, icon: 'clock' },
    { href: '/admin/guide', label: 'Documentation', icon: 'book' },
    { href: '/admin/test', label: 'Health Check', icon: 'health' },
  ];

  const signalItems = [
    { label: 'Pending approvals', value: pendingShops.length ?? 0 },
    { label: 'Approved shops', value: approvedShops.length ?? 0 },
    { label: 'Active subscriptions', value: subscriptions.length ?? 0 },
    { label: 'Customers', value: allUsers.length ?? 0 },
  ];

  const actionButtons = [
    { label: 'Approve shops', href: '/admin/pending-shops' },
    { label: 'Manage customers', href: '/admin/manage-customers' },
    { label: 'Revenue & payouts', href: '/admin/revenue' },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <DashboardTab platformStats={platformStats} pendingShops={pendingShops} approvedShops={approvedShops} recentActivity={recentActivity} planDistribution={planDistribution} weeklyOverview={weeklyOverview} threeMonthAverages={threeMonthAverages} liveMetrics={liveMetrics} />;
      case 'subscriptions':
        return <SubscriptionsTab subscriptions={subscriptions} liveMetrics={liveMetrics} threeMonthAverages={threeMonthAverages} />;
      case 'users':
        return <UsersTab users={allUsers} liveMetrics={usersLiveMetrics} />;
      case 'hierarchy':
        return <HierarchyTab subscriptions={subscriptions} liveMetrics={shopsLiveMetrics} />;
      default:
        return <DashboardTab platformStats={platformStats} pendingShops={pendingShops} approvedShops={approvedShops} recentActivity={recentActivity} planDistribution={planDistribution} weeklyOverview={weeklyOverview} threeMonthAverages={threeMonthAverages} liveMetrics={liveMetrics} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-slate-100">
      <div className="relative z-10">
        {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[18vh]">
          <div className="absolute inset-0 bg-black/70" onClick={() => setSearchOpen(false)} />
          <div className="relative w-full max-w-xl mx-4 bg-[#111827] border border-[#1f2937] rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[#1f2937]">
              <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search or jump to a section..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-slate-50 placeholder-slate-500 outline-none text-sm"
                autoFocus
              />
              <kbd className="px-1.5 py-0.5 bg-[#0f172a] border border-[#1f2937] rounded text-[10px] text-slate-400 font-mono">esc</kbd>
            </div>
            <div className="p-3 max-h-80 overflow-auto space-y-1">
              <div className="px-2 py-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Navigate</div>
              {[
                { label: 'Overview', action: () => handleSectionSelect('dashboard'), key: 'D' },
                { label: 'Customers', action: () => handleSectionSelect('users'), key: 'U' },
                { label: 'Revenue', action: () => handleSectionSelect('subscriptions'), key: 'R' },
                { label: 'Shops', action: () => handleSectionSelect('hierarchy'), key: 'S' },
                { label: 'Pending Approvals', action: () => { router.push('/admin/pending-shops'); setSearchOpen(false); }, key: 'P' },
                { label: 'System Status', action: () => { router.push('/admin/test'); setSearchOpen(false); }, key: 'T' },
              ].map((item, i) => (
                <button
                  key={i}
                  onClick={() => { item.action(); setSearchOpen(false); }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-slate-100 hover:bg-[#0f172a] transition-colors group"
                >
                  <span>{item.label}</span>
                  <kbd className="px-1.5 py-0.5 bg-[#0b1220] border border-[#1f2937] rounded text-[10px] text-slate-400 font-mono opacity-0 group-hover:opacity-100 transition-opacity">{item.key}</kbd>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-5 py-8 space-y-6">
        <header className="rounded-2xl bg-[#0f172a] border border-[#1f2937] p-5 shadow-xl shadow-black/40">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#f97316] to-[#ea580c] text-white flex items-center justify-center font-semibold text-lg">F</div>
              <div>
                <p className="text-sm text-slate-400">Admin Console</p>
                <h1 className="text-xl font-semibold text-white">{activeSection === 'dashboard' ? 'Overview' : activeSection === 'subscriptions' ? 'Revenue & Plans' : activeSection === 'users' ? 'Customers' : activeSection === 'hierarchy' ? 'Shops' : 'Admin'}</h1>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 lg:justify-end">
              <div className="relative">
                <button
                  onClick={() => setShortcutsOpen((prev) => !prev)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-100 text-sm transition-colors"
                >
                  <span>Shortcuts</span>
                  <svg className={`w-4 h-4 transition-transform ${shortcutsOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {shortcutsOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-xl border border-[#1f2937] bg-[#0f172a] shadow-2xl shadow-black/50 z-20">
                    <div className="px-3 py-2 text-[11px] uppercase tracking-wide text-slate-400 border-b border-[#1f2937]">
                      Shortcuts
                    </div>
                    <div className="py-2">
                      {quickLinks.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setShortcutsOpen(false)}
                          className="flex items-center justify-between px-3 py-2 text-sm text-slate-100 hover:bg-white/5 transition-colors no-underline"
                        >
                          <span>{link.label}</span>
                          {link.badge !== undefined && link.badge > 0 && (
                            <span className={`text-[11px] px-2 py-0.5 rounded-full ${link.highlight ? 'bg-white/20 text-white' : 'bg-white/10 text-white'}`}>
                              {link.badge}
                            </span>
                          )}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => setSearchOpen(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-100 text-sm transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>Search</span>
              </button>

              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                <div className="w-9 h-9 rounded-md bg-gradient-to-br from-[#f97316] to-[#ea580c] text-white flex items-center justify-center text-xs font-semibold">
                  {user.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'A'}
                </div>
                <div className="hidden sm:block leading-tight">
                  <p className="text-sm text-white font-medium">{user.name || 'Admin'}</p>
                  <p className="text-xs text-slate-300 capitalize">{user.role || 'administrator'}</p>
                </div>
              </div>

              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#ef4444] hover:bg-[#dc2626] text-white text-sm font-medium transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </header>

        <div className="grid gap-6 xl:grid-cols-[320px,1fr]">
          {/* Left rail */}
          <section className="space-y-4">
            <div className="rounded-2xl bg-[#0f172a] border border-[#1f2937] p-4 shadow-lg shadow-black/30">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs uppercase tracking-wide text-slate-400">Status</p>
                <span className="text-[11px] text-emerald-400">Live</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-xl bg-white/5 border border-white/10 px-3 py-2.5">
                  <div>
                    <p className="text-xs text-slate-300">Pending approvals</p>
                    <p className="text-lg font-semibold text-white">{pendingShops.length ?? 0}</p>
                  </div>
                  <Link href="/admin/pending-shops" className="text-xs text-orange-300 hover:text-orange-200 no-underline">Review</Link>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-white/5 border border-white/10 px-3 py-2.5">
                  <div>
                    <p className="text-xs text-slate-300">Active subscriptions</p>
                    <p className="text-lg font-semibold text-white">{subscriptions.length ?? 0}</p>
                  </div>
                  <Link href="/admin/revenue" className="text-xs text-orange-300 hover:text-orange-200 no-underline">View</Link>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-white/5 border border-white/10 px-3 py-2.5">
                  <div>
                    <p className="text-xs text-slate-300">Customers</p>
                    <p className="text-lg font-semibold text-white">{allUsers.length ?? 0}</p>
                  </div>
                  <Link href="/admin/manage-customers" className="text-xs text-orange-300 hover:text-orange-200 no-underline">Manage</Link>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-white/5 border border-white/10 px-3 py-2.5">
                  <div>
                    <p className="text-xs text-slate-300">Approved shops</p>
                    <p className="text-lg font-semibold text-white">{approvedShops.length ?? 0}</p>
                  </div>
                  <Link href="/admin/manage-shops" className="text-xs text-orange-300 hover:text-orange-200 no-underline">Open</Link>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-[#0f172a] border border-[#1f2937] p-4 shadow-lg shadow-black/30 space-y-2">
              <p className="text-xs uppercase tracking-wide text-slate-400">Quick actions</p>
              <div className="flex flex-wrap gap-2">
                {actionButtons.map((action) => (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="rounded-full bg-gradient-to-r from-[#f97316] to-[#fb923c] text-white text-sm px-3 py-2 no-underline shadow-md shadow-[#f97316]/30 hover:brightness-110 transition"
                  >
                    {action.label}
                  </Link>
                ))}
              </div>
            </div>
          </section>

          {/* Main canvas */}
          <section className="space-y-4">
            <div className="rounded-2xl bg-[#0f172a] border border-[#1f2937] p-5 shadow-xl shadow-black/40">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {navigationItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSectionSelect(item.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-full border text-sm transition-all ${
                      activeSection === item.id
                        ? 'bg-white text-[#0f172a] border-white shadow-lg'
                        : 'bg-white/5 text-slate-200 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                    </svg>
                    <span>{item.label}</span>
                    {item.badge !== undefined && (
                      <span className={`text-[11px] px-2 py-0.5 rounded-full ${activeSection === item.id ? 'bg-[#0f172a]/10 text-[#0f172a]' : 'bg-white/10 text-white'}`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <div className="rounded-2xl border border-[#1f2937] bg-[#0b1220] p-4 md:p-6 shadow-inner shadow-black/30">
                {renderContent()}
              </div>
            </div>

          </section>
        </div>
      </div>
      </div>
    </div>
  );
}

export default function AdminHome() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AdminHomeContent />
    </Suspense>
  );
}
