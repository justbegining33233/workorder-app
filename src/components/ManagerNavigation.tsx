// Enhanced Navigation Component for Manager Role
// Focuses on team management, performance monitoring, and operational oversight

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  FaHome,
  FaUsers,
  FaChartBar,
  FaClipboardList,
  FaCalendarAlt,
  FaComments,
  FaUser,
  FaBell,
  FaCog,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaExclamationTriangle,
  FaCheckCircle,
  FaEye,
  FaList,
  FaBox,
  FaSearch
} from 'react-icons/fa';

interface ManagerNavProps {
  unreadMessages?: number;
  urgentJobs?: number;
  teamAlerts?: number;
  pendingApprovals?: number;
}

export default function ManagerNavigation({
  unreadMessages = 0,
  urgentJobs = 0,
  teamAlerts = 0,
  pendingApprovals = 0
}: ManagerNavProps) {
  const { logout, user } = useAuth();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState(0);

  useEffect(() => {
    setNotifications(unreadMessages + urgentJobs + teamAlerts + pendingApprovals);
  }, [unreadMessages, urgentJobs, teamAlerts, pendingApprovals]);

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/manager/dashboard',
      icon: FaHome,
      description: 'Management overview'
    },
    {
      name: 'Overview',
      href: '/manager/overview',
      icon: FaEye,
      description: 'Shop overview'
    },
    {
      name: 'Work Orders',
      href: '/manager/work-orders',
      icon: FaList,
      description: 'Work order management'
    },
    {
      name: 'Team',
      href: '/manager/team',
      icon: FaUsers,
      badge: teamAlerts > 0 ? teamAlerts : undefined,
      description: 'Manage technicians'
    },
    {
      name: 'Jobs',
      href: '/manager/jobs',
      icon: FaClipboardList,
      badge: urgentJobs > 0 ? urgentJobs : undefined,
      description: 'Monitor service calls'
    },
    {
      name: 'Inventory',
      href: '/manager/inventory',
      icon: FaBox,
      description: 'Parts and inventory'
    },
    {
      name: 'Inspections',
      href: '/manager/inspections',
      icon: FaSearch,
      description: 'Vehicle inspections'
    },
    {
      name: 'Reports',
      href: '/manager/reports',
      icon: FaChartBar,
      description: 'Performance analytics'
    },
    {
      name: 'Schedule',
      href: '/manager/schedule',
      icon: FaCalendarAlt,
      description: 'Team scheduling'
    },
    {
      name: 'Approvals',
      href: '/manager/approvals',
      icon: FaCheckCircle,
      badge: pendingApprovals > 0 ? pendingApprovals : undefined,
      description: 'Pending approvals'
    },
    {
      name: 'Messages',
      href: '/manager/messages',
      icon: FaComments,
      badge: unreadMessages > 0 ? unreadMessages : undefined,
      description: 'Team communications'
    },
    {
      name: 'Profile',
      href: '/manager/profile',
      icon: FaUser,
      description: 'Account settings'
    }
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/manager/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">F</span>
              </div>
              <span className="text-xl font-bold text-gray-900">FixTray</span>
              <span className="text-sm text-gray-500">Manager Portal</span>
            </Link>

            {/* Main Navigation */}
            <div className="flex items-center space-x-1">
              {navigationItems.slice(0, 5).map((item) => (
                <Link
                  key={item.name}
                  href={item.href as Route}
                  className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'bg-purple-50 text-purple-600'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <item.icon className="w-4 h-4" />
                    <span>{item.name}</span>
                    {item.badge && (
                      <span className="absolute -top-1 -right-1 bg-purple-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {item.badge > 9 ? '9+' : item.badge}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-4">
              {/* Urgent Alerts */}
              {(urgentJobs > 0 || teamAlerts > 0) && (
                <div className="flex items-center space-x-2 bg-red-50 text-red-700 px-3 py-1 rounded-full text-sm">
                  <FaExclamationTriangle className="w-4 h-4" />
                  <span>Alerts</span>
                  <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {urgentJobs + teamAlerts}
                  </span>
                </div>
              )}

              {/* Notifications */}
              <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">
                <FaBell className="w-5 h-5" />
                {notifications > 0 && (
                  <span className="absolute -top-1 -right-1 bg-purple-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {notifications > 9 ? '9+' : notifications}
                  </span>
                )}
              </button>

              {/* Quick Actions */}
              <Link
                href={"/manager/jobs" as Route}
                className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Monitor Jobs
              </Link>

              {/* User Menu */}
              <div className="relative">
                <button className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <FaUser className="w-4 h-4 text-gray-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{user?.name || 'Manager'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200">
        <div className="grid grid-cols-5 h-16">
          {navigationItems.slice(0, 4).map((item, index) => (
            <Link
              key={item.name}
              href={item.href as Route}
              className={`flex flex-col items-center justify-center space-y-1 ${
                isActive(item.href) ? 'text-purple-500' : 'text-gray-600'
              }`}
            >
              <div className="relative">
                <item.icon className="w-5 h-5" />
                {item.badge && (
                  <span className="absolute -top-1 -right-1 bg-purple-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {item.badge > 9 ? '9' : item.badge}
                  </span>
                )}
              </div>
              <span className="text-xs font-medium">{item.name.split(' ')[0]}</span>
            </Link>
          ))}

          {/* More Menu */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center space-y-1 text-gray-600"
          >
            <FaBars className="w-5 h-5" />
            <span className="text-xs font-medium">More</span>
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Menu</h3>
              <button onClick={() => setIsMobileMenuOpen(false)}>
                <FaTimes className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href as Route}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 p-3 rounded-lg ${
                    isActive(item.href) ? 'bg-purple-50 text-purple-600' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-gray-500">{item.description}</div>
                  </div>
                  {item.badge && (
                    <span className="bg-purple-500 text-white text-xs rounded-full px-2 py-1">
                      {item.badge}
                    </span>
                  )}
                </Link>
              ))}

              <hr className="my-4" />

              <button
                onClick={logout}
                className="flex items-center space-x-3 p-3 rounded-lg text-gray-700 hover:bg-gray-50 w-full text-left"
              >
                <FaSignOutAlt className="w-5 h-5" />
                <span className="font-medium">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Spacer for fixed navigation */}
      <div className="h-16 md:h-16" />
    </>
  );
}