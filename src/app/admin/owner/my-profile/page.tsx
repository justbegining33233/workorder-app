'use client';

import { useEffect } from 'react';
import type { Route } from 'next';
import { useRouter } from 'next/navigation';

export default function OwnerMyProfileLegacyPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/owner?section=profile' as Route);
  }, [router]);

  return (
    <div style={{ minHeight: '100vh', background: '#09090B', color: '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      Redirecting...
    </div>
  );
}
