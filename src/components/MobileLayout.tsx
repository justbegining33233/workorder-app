'use client';

import { useState, useEffect } from 'react';
import MobileNav from './MobileNav';

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
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #3d3d3d 0%, #4a4a4a 50%, #525252 100%)',
        display: 'flex',
        flexDirection: 'column',
        paddingBottom: '80px', // Space for mobile nav
      }}>
        {/* Mobile Header */}
        {topNavContent && (
          <div style={{
            background: 'rgba(0,0,0,0.3)',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}>
            {showSidebar && sidebarContent && (
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#e5e7eb',
                  fontSize: '20px',
                  cursor: 'pointer',
                  padding: '8px',
                }}
              >
                ☰
              </button>
            )}
            {topNavContent}
          </div>
        )}

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && sidebarContent && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 999,
            }}
            onClick={() => setSidebarOpen(false)}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                bottom: 0,
                width: '280px',
                background: 'rgba(0,0,0,0.95)',
                transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
                transition: 'transform 0.3s ease',
                padding: '20px',
                overflowY: 'auto',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {sidebarContent}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div style={{
          flex: 1,
          padding: '16px',
          overflowY: 'auto',
        }}>
          {children}
        </div>

        {/* Mobile Navigation */}
        <MobileNav role={role} />
      </div>
    );
  }

  // Desktop Layout (existing)
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #3d3d3d 0%, #4a4a4a 50%, #525252 100%)',
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