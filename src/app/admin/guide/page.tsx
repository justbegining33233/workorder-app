'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRequireAuth } from '@/contexts/AuthContext';

interface Feature {
  name: string;
  description: string;
  status: 'ready' | 'partial' | 'setup-required' | 'not-implemented';
  route?: string;
  notes?: string;
  apiEndpoint?: string;
}

interface FeatureCategory {
  name: string;
  icon: string;
  description: string;
  features: Feature[];
}

export default function AppGuidePage() {
  const { user, isLoading } = useRequireAuth(['admin']);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const categories: FeatureCategory[] = [
    {
      name: 'Authentication & Security',
      icon: '🔐',
      description: 'User login, registration, and security features',
      features: [
        { name: 'User Login', description: 'Email/password authentication for all user types', status: 'ready', route: '/login', apiEndpoint: '/api/auth/login' },
        { name: 'User Registration', description: 'New user signup with email verification', status: 'ready', route: '/register', apiEndpoint: '/api/auth/register' },
        { name: 'Shop Registration', description: 'Multi-step shop owner registration', status: 'ready', route: '/register/shop', apiEndpoint: '/api/shops/register' },
        { name: 'Customer Registration', description: 'Customer account creation', status: 'ready', route: '/register/customer', apiEndpoint: '/api/customers/register' },
        { name: 'Password Reset', description: 'Forgot password flow with email', status: 'ready', route: '/forgot-password', apiEndpoint: '/api/auth/forgot-password' },
        { name: 'JWT Authentication', description: 'Secure token-based auth', status: 'ready', notes: 'Tokens stored in localStorage' },
        { name: 'CSRF Protection', description: 'Cross-site request forgery prevention', status: 'ready', apiEndpoint: '/api/auth/csrf' },
        { name: 'Rate Limiting', description: 'Brute force protection on login', status: 'ready', notes: 'Built into auth endpoints' },
        { name: 'Session Management', description: 'View and revoke active sessions', status: 'ready', apiEndpoint: '/api/auth/sessions' },
        { name: 'Two-Factor Auth (2FA)', description: 'Additional login security', status: 'not-implemented', notes: 'Planned for future release' },
      ]
    },
    {
      name: 'Admin Panel',
      icon: '👑',
      description: 'Platform administration and management',
      features: [
        { name: 'Admin Dashboard', description: 'Overview of platform stats', status: 'ready', route: '/admin/home' },
        { name: 'Pending Shop Approvals', description: 'Review and approve new shops', status: 'ready', route: '/admin/pending-shops', apiEndpoint: '/api/shops/pending' },
        { name: 'Manage All Shops', description: 'View and manage approved shops', status: 'ready', route: '/admin/accepted-shops', apiEndpoint: '/api/shops/accepted' },
        { name: 'User Management', description: 'View all users, roles, permissions', status: 'ready', route: '/admin/user-management', apiEndpoint: '/api/admin/users' },
        { name: 'Subscription Management', description: 'Manage shop subscriptions', status: 'ready', route: '/admin/subscriptions', apiEndpoint: '/api/subscriptions' },
        { name: 'Platform Analytics', description: 'Usage stats and metrics', status: 'ready', route: '/admin/platform-analytics', apiEndpoint: '/api/admin/analytics' },
        { name: 'Activity Logs', description: 'Track user and system activity', status: 'ready', route: '/admin/activity-logs', apiEndpoint: '/api/admin/activity-logs' },
        { name: 'Coupon Management', description: 'Create and manage discount codes', status: 'ready', apiEndpoint: '/api/admin/coupons' },
        { name: 'Financial Reports', description: 'Revenue and billing reports', status: 'ready', apiEndpoint: '/api/admin/financial-reports' },
        { name: 'System Settings', description: 'Configure platform settings', status: 'partial', route: '/admin/system-settings', notes: 'Basic settings available' },
      ]
    },
    {
      name: 'Shop Management',
      icon: '🏪',
      description: 'Shop owner features and settings',
      features: [
        { name: 'Shop Dashboard', description: 'Shop overview and stats', status: 'ready', route: '/shop/dashboard' },
        { name: 'Shop Profile', description: 'Edit shop info, hours, logo', status: 'ready', route: '/shop/profile', apiEndpoint: '/api/shop/profile' },
        { name: 'Service Catalog', description: 'Manage services offered', status: 'ready', route: '/shop/services', apiEndpoint: '/api/shops/services' },
        { name: 'Labor Rates', description: 'Set hourly labor rates', status: 'ready', apiEndpoint: '/api/shops/labor-rates' },
        { name: 'Team Management', description: 'Add/manage technicians', status: 'ready', route: '/shop/team', apiEndpoint: '/api/techs' },
        { name: 'Manager Role', description: 'Assign manager permissions', status: 'ready', apiEndpoint: '/api/manager/dashboard' },
        { name: 'Work Assignments', description: 'Assign jobs to technicians', status: 'ready', apiEndpoint: '/api/manager/assignments' },
        { name: 'Shop Settings', description: 'Configure shop preferences', status: 'ready', apiEndpoint: '/api/shop/settings' },
        { name: 'Business Hours', description: 'Set operating hours', status: 'ready', notes: 'Part of shop profile' },
        { name: 'Multiple Locations', description: 'Manage multiple shop locations', status: 'not-implemented', notes: 'Single location per shop currently' },
      ]
    },
    {
      name: 'Work Orders',
      icon: '📋',
      description: 'Create and manage repair orders',
      features: [
        { name: 'Create Work Order', description: 'New work order with customer/vehicle', status: 'ready', route: '/shop/workorders/new', apiEndpoint: '/api/workorders' },
        { name: 'Work Order List', description: 'View all work orders', status: 'ready', route: '/shop/workorders', apiEndpoint: '/api/workorders' },
        { name: 'Work Order Details', description: 'Full order details and editing', status: 'ready', route: '/shop/workorders/[id]' },
        { name: 'Status Updates', description: 'Change order status (pending, in-progress, complete)', status: 'ready', apiEndpoint: '/api/workorders/[id]' },
        { name: 'Photo Uploads', description: 'Attach before/after photos', status: 'ready', apiEndpoint: '/api/workorders/[id]/photos' },
        { name: 'Add Line Items', description: 'Parts, labor, fees', status: 'ready', notes: 'Included in work order creation' },
        { name: 'Invoice Generation', description: 'Create invoice from work order', status: 'ready', apiEndpoint: '/api/workorders/[id]/invoice' },
        { name: 'Payment Processing', description: 'Record payments on orders', status: 'ready', apiEndpoint: '/api/workorders/payment' },
        { name: 'Print Work Order', description: 'Print-friendly work order view', status: 'partial', notes: 'Basic print CSS available' },
        { name: 'Work Order Templates', description: 'Save common job templates', status: 'not-implemented', notes: 'Planned feature' },
      ]
    },
    {
      name: 'Customer Management',
      icon: '👤',
      description: 'Customer profiles and vehicles',
      features: [
        { name: 'Customer List', description: 'View all shop customers', status: 'ready', route: '/shop/customers', apiEndpoint: '/api/customers' },
        { name: 'Add Customer', description: 'Create new customer profile', status: 'ready', apiEndpoint: '/api/customers' },
        { name: 'Customer Profile', description: 'View/edit customer details', status: 'ready', apiEndpoint: '/api/customers/profile' },
        { name: 'Vehicle Management', description: 'Add customer vehicles', status: 'ready', apiEndpoint: '/api/customers/vehicles' },
        { name: 'Service History', description: 'View past work orders', status: 'ready', notes: 'Available in customer profile' },
        { name: 'Customer Notes', description: 'Add notes to customer file', status: 'ready', notes: 'Part of customer profile' },
        { name: 'Document Storage', description: 'Store customer documents', status: 'ready', apiEndpoint: '/api/customers/documents' },
        { name: 'Payment Methods', description: 'Save payment methods', status: 'partial', apiEndpoint: '/api/customers/payment-methods', notes: 'Stripe integration required' },
      ]
    },
    {
      name: 'Customer Portal',
      icon: '🌐',
      description: 'Customer-facing features',
      features: [
        { name: 'Customer Login', description: 'Customer account access', status: 'ready', route: '/customer/login' },
        { name: 'Customer Dashboard', description: 'Overview of orders and vehicles', status: 'ready', route: '/customer/dashboard' },
        { name: 'View Work Orders', description: 'See order status and history', status: 'ready', route: '/customer/orders' },
        { name: 'Manage Vehicles', description: 'Add/edit vehicles', status: 'ready', route: '/customer/vehicles' },
        { name: 'Favorite Shops', description: 'Save preferred shops', status: 'ready', apiEndpoint: '/api/customers/favorites' },
        { name: 'Technician Tracking', description: 'Track tech location on mobile jobs', status: 'partial', apiEndpoint: '/api/customers/tracking', notes: 'Requires GPS setup' },
        { name: 'Online Booking', description: 'Book appointments online', status: 'ready', route: '/customer/book', apiEndpoint: '/api/appointments' },
        { name: 'Message Shop', description: 'Chat with shop', status: 'ready', apiEndpoint: '/api/customers/messages' },
        { name: 'Pay Online', description: 'Pay invoices online', status: 'setup-required', notes: 'Requires Stripe configuration' },
      ]
    },
    {
      name: 'Time Tracking & Payroll',
      icon: '⏰',
      description: 'Employee time and payroll management',
      features: [
        { name: 'Clock In/Out', description: 'Technician time clock', status: 'ready', route: '/tech/timeclock', apiEndpoint: '/api/timeclock' },
        { name: 'Time Entries', description: 'View and edit time records', status: 'ready', apiEndpoint: '/api/time-tracking' },
        { name: 'GPS Verification', description: 'Location-based clock in', status: 'partial', apiEndpoint: '/api/time-tracking', notes: 'Requires location permissions' },
        { name: 'Payroll Reports', description: 'Generate payroll summaries', status: 'ready', apiEndpoint: '/api/shop/payroll' },
        { name: 'Overtime Calculation', description: 'Auto-calculate overtime', status: 'ready', notes: 'Based on time entries' },
        { name: 'Export Payroll', description: 'Export for accounting', status: 'partial', notes: 'CSV export available' },
      ]
    },
    {
      name: 'Inventory Management',
      icon: '📦',
      description: 'Parts and inventory tracking',
      features: [
        { name: 'Inventory List', description: 'View all inventory items', status: 'ready', route: '/shop/inventory', apiEndpoint: '/api/inventory' },
        { name: 'Add Inventory', description: 'Add new parts/items', status: 'ready', apiEndpoint: '/api/inventory' },
        { name: 'Low Stock Alerts', description: 'Notifications for low stock', status: 'ready', apiEndpoint: '/api/inventory/low-stock' },
        { name: 'Inventory Requests', description: 'Request parts from admin', status: 'ready', apiEndpoint: '/api/shop/inventory-requests' },
        { name: 'Stock Adjustments', description: 'Adjust quantities manually', status: 'ready', apiEndpoint: '/api/shop/inventory-stock' },
        { name: 'Reorder Points', description: 'Set auto-reorder levels', status: 'partial', notes: 'Manual reorder only' },
        { name: 'Barcode Scanning', description: 'Scan parts with barcode', status: 'not-implemented', notes: 'Planned feature' },
        { name: 'Vendor Management', description: 'Manage parts suppliers', status: 'not-implemented', notes: 'Planned feature' },
      ]
    },
    {
      name: 'Messaging & Notifications',
      icon: '💬',
      description: 'Communication features',
      features: [
        { name: 'In-App Messaging', description: 'Shop-to-customer messaging', status: 'ready', apiEndpoint: '/api/messages' },
        { name: 'Customer Chat', description: 'Real-time chat with customers', status: 'ready', apiEndpoint: '/api/customers/messages' },
        { name: 'Portal Chat', description: 'Customer portal messaging', status: 'ready', apiEndpoint: '/api/portal-chat' },
        { name: 'In-App Notifications', description: 'Bell icon notifications', status: 'ready', apiEndpoint: '/api/notifications' },
        { name: 'Push Notifications', description: 'Browser push notifications', status: 'setup-required', apiEndpoint: '/api/push/subscribe', notes: 'Requires VAPID keys setup' },
        { name: 'Email Notifications', description: 'Email alerts for updates', status: 'setup-required', notes: 'Requires email service (SendGrid, etc.)' },
        { name: 'SMS Notifications', description: 'Text message alerts', status: 'setup-required', notes: 'Requires Twilio setup' },
      ]
    },
    {
      name: 'Appointments & Scheduling',
      icon: '📅',
      description: 'Booking and calendar features',
      features: [
        { name: 'Appointment Booking', description: 'Schedule appointments', status: 'ready', apiEndpoint: '/api/appointments' },
        { name: 'Available Slots', description: 'Define available time slots', status: 'ready', notes: 'Based on business hours' },
        { name: 'Appointment Reminders', description: 'Auto-remind customers', status: 'partial', notes: 'Requires notification setup' },
        { name: 'Calendar View', description: 'View appointments on calendar', status: 'ready', route: '/shop/calendar' },
        { name: 'Recurring Appointments', description: 'Set up repeat bookings', status: 'not-implemented', notes: 'Planned feature' },
      ]
    },
    {
      name: 'Reviews & Ratings',
      icon: '⭐',
      description: 'Customer feedback system',
      features: [
        { name: 'Submit Reviews', description: 'Customers leave reviews', status: 'ready', apiEndpoint: '/api/reviews' },
        { name: 'View Reviews', description: 'Shop can see their reviews', status: 'ready', route: '/shop/reviews' },
        { name: 'Review Moderation', description: 'Admin can moderate reviews', status: 'ready', notes: 'Via admin panel' },
        { name: 'Rating Analytics', description: 'Average ratings and trends', status: 'ready', notes: 'Part of shop analytics' },
        { name: 'Review Responses', description: 'Shop can respond to reviews', status: 'partial', notes: 'Basic response available' },
      ]
    },
    {
      name: 'Payments & Billing',
      icon: '💳',
      description: 'Payment processing and subscriptions',
      features: [
        { name: 'Stripe Integration', description: 'Credit card payments', status: 'setup-required', apiEndpoint: '/api/payment/create-intent', notes: 'Requires Stripe API keys' },
        { name: 'Subscription Plans', description: 'Monthly/yearly shop plans', status: 'ready', apiEndpoint: '/api/subscriptions' },
        { name: 'Payment Recording', description: 'Record cash/check payments', status: 'ready', notes: 'Manual payment entry' },
        { name: 'Invoice Creation', description: 'Generate customer invoices', status: 'ready', apiEndpoint: '/api/workorders/[id]/invoice' },
        { name: 'Refunds', description: 'Process refunds', status: 'setup-required', notes: 'Requires Stripe setup' },
        { name: 'Payment History', description: 'View past transactions', status: 'ready', notes: 'Available in customer profile' },
      ]
    },
    {
      name: 'Reports & Analytics',
      icon: '📊',
      description: 'Business intelligence features',
      features: [
        { name: 'Work Order Analytics', description: 'Job completion metrics', status: 'ready', apiEndpoint: '/api/analytics' },
        { name: 'Revenue Reports', description: 'Income and sales data', status: 'ready', route: '/shop/reports' },
        { name: 'Technician Performance', description: 'Tech productivity metrics', status: 'ready', notes: 'Based on work order completion' },
        { name: 'Customer Reports', description: 'Customer acquisition and retention', status: 'partial', notes: 'Basic stats available' },
        { name: 'Export to CSV', description: 'Download reports as CSV', status: 'ready', apiEndpoint: '/api/admin/export' },
        { name: 'Custom Date Ranges', description: 'Filter by date range', status: 'ready', notes: 'Available on most reports' },
      ]
    },
    {
      name: 'File Uploads & Storage',
      icon: '📁',
      description: 'File management features',
      features: [
        { name: 'Image Uploads', description: 'Upload photos to work orders', status: 'ready', apiEndpoint: '/api/upload' },
        { name: 'Document Storage', description: 'Store PDFs and documents', status: 'ready', apiEndpoint: '/api/customers/documents' },
        { name: 'Cloudinary Integration', description: 'Cloud image storage', status: 'setup-required', notes: 'Requires Cloudinary API keys' },
        { name: 'Local File Storage', description: 'Store files on server', status: 'ready', notes: 'Default storage method' },
      ]
    },
    {
      name: 'System & Infrastructure',
      icon: '⚙️',
      description: 'Technical system features',
      features: [
        { name: 'Health Check Endpoint', description: 'API health monitoring', status: 'ready', apiEndpoint: '/api/health' },
        { name: 'SQLite Database', description: 'Local database storage', status: 'ready', notes: 'Using Prisma ORM' },
        { name: 'PostgreSQL Support', description: 'Production database option', status: 'setup-required', notes: 'Change DATABASE_URL in .env' },
        { name: 'Multi-tenant Architecture', description: 'Shop data isolation', status: 'ready', apiEndpoint: '/api/tenants' },
        { name: 'Audit Logging', description: 'Track system changes', status: 'ready', apiEndpoint: '/api/admin/audit-logs' },
        { name: 'Backup & Restore', description: 'Database backups', status: 'partial', notes: 'Manual backup scripts available' },
        { name: 'Docker Support', description: 'Container deployment', status: 'ready', notes: 'Dockerfile included' },
      ]
    },
  ];

  const statusInfo = {
    'ready': { label: 'Ready to Use', color: 'bg-emerald-500', textColor: 'text-emerald-500', bgLight: 'bg-emerald-500/10' },
    'partial': { label: 'Partially Implemented', color: 'bg-amber-500', textColor: 'text-amber-500', bgLight: 'bg-amber-500/10' },
    'setup-required': { label: 'Needs Setup', color: 'bg-blue-500', textColor: 'text-blue-500', bgLight: 'bg-blue-500/10' },
    'not-implemented': { label: 'Not Yet Available', color: 'bg-gray-500', textColor: 'text-gray-400', bgLight: 'bg-gray-500/10' },
  };

  const allFeatures = categories.flatMap(c => c.features);
  const totalFeatures = allFeatures.length;
  const readyFeatures = allFeatures.filter(f => f.status === 'ready').length;
  const partialFeatures = allFeatures.filter(f => f.status === 'partial').length;
  const setupFeatures = allFeatures.filter(f => f.status === 'setup-required').length;
  const notImplemented = allFeatures.filter(f => f.status === 'not-implemented').length;

  const filteredCategories = categories.map(cat => ({
    ...cat,
    features: filterStatus === 'all' ? cat.features : cat.features.filter(f => f.status === filterStatus)
  })).filter(cat => cat.features.length > 0);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-gray-300 text-lg">Loading...</div>
      </div>
    );
  }

  // If no user, the useRequireAuth hook will handle redirect
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="bg-black/30 border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                <span className="text-white font-bold">F</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">FixTray Feature Guide</h1>
                <p className="text-gray-400 text-sm">What you can and can't do</p>
              </div>
            </div>
            <Link href="/admin/home" className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-300 text-sm transition-colors">
              ← Back to Admin
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-black/30 rounded-xl p-4 border border-white/10">
            <p className="text-gray-400 text-sm">Total Features</p>
            <p className="text-3xl font-bold text-white">{totalFeatures}</p>
          </div>
          <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/30">
            <p className="text-emerald-400 text-sm">Ready to Use</p>
            <p className="text-3xl font-bold text-emerald-500">{readyFeatures}</p>
          </div>
          <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/30">
            <p className="text-amber-400 text-sm">Partial</p>
            <p className="text-3xl font-bold text-amber-500">{partialFeatures}</p>
          </div>
          <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/30">
            <p className="text-blue-400 text-sm">Needs Setup</p>
            <p className="text-3xl font-bold text-blue-500">{setupFeatures}</p>
          </div>
          <div className="bg-gray-500/10 rounded-xl p-4 border border-gray-500/30">
            <p className="text-gray-400 text-sm">Not Available</p>
            <p className="text-3xl font-bold text-gray-500">{notImplemented}</p>
          </div>
        </div>

        {/* Legend & Filter */}
        <div className="bg-black/30 rounded-xl p-4 border border-white/10 mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                <span className="text-gray-300 text-sm">Ready - Works out of the box</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                <span className="text-gray-300 text-sm">Partial - Some limitations</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                <span className="text-gray-300 text-sm">Setup Required - Needs configuration</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-gray-500"></span>
                <span className="text-gray-300 text-sm">Not Available - Planned for future</span>
              </div>
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-gray-200 focus:outline-none focus:border-red-500/50"
            >
              <option value="all">Show All</option>
              <option value="ready">Ready to Use</option>
              <option value="partial">Partial</option>
              <option value="setup-required">Needs Setup</option>
              <option value="not-implemented">Not Available</option>
            </select>
          </div>
        </div>

        {/* Categories */}
        <div className="space-y-4">
          {filteredCategories.map((category) => {
            const isExpanded = expandedCategory === category.name;
            const readyCount = category.features.filter(f => f.status === 'ready').length;
            
            return (
              <div key={category.name} className="bg-black/30 rounded-xl border border-white/10 overflow-hidden">
                <button
                  onClick={() => setExpandedCategory(isExpanded ? null : category.name)}
                  className="w-full p-5 flex items-center justify-between hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">{category.icon}</span>
                    <div className="text-left">
                      <h2 className="text-lg font-semibold text-white">{category.name}</h2>
                      <p className="text-gray-400 text-sm">{category.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-emerald-400 font-semibold">{readyCount}/{category.features.length}</p>
                      <p className="text-gray-500 text-xs">features ready</p>
                    </div>
                    <span className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-white/10 p-4">
                    <div className="space-y-3">
                      {category.features.map((feature, idx) => (
                        <div key={idx} className={`p-4 rounded-lg ${statusInfo[feature.status].bgLight} border border-white/5`}>
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-1">
                                <span className={`w-2 h-2 rounded-full ${statusInfo[feature.status].color}`}></span>
                                <h3 className="text-white font-medium">{feature.name}</h3>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${statusInfo[feature.status].bgLight} ${statusInfo[feature.status].textColor}`}>
                                  {statusInfo[feature.status].label}
                                </span>
                              </div>
                              <p className="text-gray-400 text-sm ml-5">{feature.description}</p>
                              {feature.notes && (
                                <p className="text-gray-500 text-xs ml-5 mt-1">ℹ️ {feature.notes}</p>
                              )}
                              {feature.apiEndpoint && (
                                <p className="text-gray-600 text-xs ml-5 mt-1 font-mono">API: {feature.apiEndpoint}</p>
                              )}
                            </div>
                            {feature.route && (
                              <Link
                                href={feature.route}
                                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-300 text-xs transition-colors whitespace-nowrap"
                              >
                                Open →
                              </Link>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Setup Required Section */}
        <div className="mt-8 bg-blue-500/10 rounded-xl p-6 border border-blue-500/30">
          <h2 className="text-xl font-bold text-blue-400 mb-4">🔧 Features That Need Setup</h2>
          <p className="text-gray-300 mb-4">These features are built but require external service configuration:</p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-black/20 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-2">💳 Stripe Payments</h3>
              <p className="text-gray-400 text-sm mb-2">For online payment processing</p>
              <code className="text-xs text-blue-400 bg-black/30 px-2 py-1 rounded">STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY</code>
            </div>
            <div className="bg-black/20 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-2">📧 Email Service</h3>
              <p className="text-gray-400 text-sm mb-2">For email notifications (SendGrid, Resend, etc.)</p>
              <code className="text-xs text-blue-400 bg-black/30 px-2 py-1 rounded">EMAIL_API_KEY, EMAIL_FROM</code>
            </div>
            <div className="bg-black/20 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-2">📱 SMS (Twilio)</h3>
              <p className="text-gray-400 text-sm mb-2">For text message notifications</p>
              <code className="text-xs text-blue-400 bg-black/30 px-2 py-1 rounded">TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN</code>
            </div>
            <div className="bg-black/20 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-2">🔔 Push Notifications</h3>
              <p className="text-gray-400 text-sm mb-2">For browser push notifications</p>
              <code className="text-xs text-blue-400 bg-black/30 px-2 py-1 rounded">VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY</code>
            </div>
            <div className="bg-black/20 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-2">☁️ Cloudinary</h3>
              <p className="text-gray-400 text-sm mb-2">For cloud image storage</p>
              <code className="text-xs text-blue-400 bg-black/30 px-2 py-1 rounded">CLOUDINARY_URL</code>
            </div>
            <div className="bg-black/20 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-2">🗄️ PostgreSQL</h3>
              <p className="text-gray-400 text-sm mb-2">For production database</p>
              <code className="text-xs text-blue-400 bg-black/30 px-2 py-1 rounded">DATABASE_URL=postgresql://...</code>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>FixTray Work Order Management • {totalFeatures} Features • {readyFeatures} Ready to Use</p>
        </div>
      </div>
    </div>
  );
}
