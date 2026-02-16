'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CustomerHome() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/customer/dashboard');
  }, [router]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #3d3d3d 0%, #4a4a4a 50%, #525252 100%)'
    }}>
      <div style={{ color: '#e5e7eb', fontSize: 18 }}>Redirecting to Customer Dashboard...</div>
    </div>
  );
}
