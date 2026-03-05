'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function FloatingSignOut() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only show when logged in (not on login/auth pages)
    const isAuthPage = pathname?.startsWith('/auth');
    const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('token');
    setVisible(!isAuthPage && hasToken);
  }, [pathname]);

  if (!visible) return null;

  const handleSignOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('shopId');
    localStorage.removeItem('userId');
    window.location.href = '/auth/login';
  };

  return (
    <button
      onClick={handleSignOut}
      style={{
        position: 'fixed',
        bottom: 80,
        right: 12,
        zIndex: 9999,
        background: '#e5332a',
        color: 'white',
        border: 'none',
        borderRadius: 50,
        width: 48,
        height: 48,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 20,
        boxShadow: '0 4px 14px rgba(229,51,42,0.4)',
        cursor: 'pointer',
      }}
      title="Sign Out"
    >
      🚪
    </button>
  );
}
