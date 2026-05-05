'use client';

import { useState, useEffect } from 'react';
import MobileShell from './MobileShell';
import { IconMenu } from '@/components/icons';

interface MobileLayoutProps {
  children: React.ReactNode;
  role: 'customer' | 'shop' | 'tech' | 'manager';
  showSidebar?: boolean;
  sidebarContent?: React.ReactNode;
  topNavContent?: React.ReactNode;
}

export default function MobileLayout({
  children,
  role,
  showSidebar = true,
  sidebarContent,
  topNavContent
}: MobileLayoutProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (isMobile) {
    return (
      <MobileShell role={role} isHome={false}>
        {children}
      </MobileShell>
    );
  }

  // Desktop Layout (existing)
  return (
    <div style={{
      minHeight: '100vh',
      background: 'transparent',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Top Navigation */}
      {topNavContent}

      {/* Main Layout with Sidebar */}
      <div style={{ display: 'flex', flex: 1 }}>
        {/* Sidebar */}
        {showSidebar && sidebarContent && (
          <div style={{
            width: sidebarOpen ? '280px' : '0',
            overflow: 'hidden',
            transition: 'width 0.3s ease',
            background: 'rgba(0,0,0,0.3)',
            borderRight: '1px solid rgba(255,255,255,0.1)',
          }}>
            {sidebarContent}
          </div>
        )}

        {/* Main Content */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{ maxWidth: 1400, margin: '0 auto', padding: 32 }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}