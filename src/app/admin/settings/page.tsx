'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminSettingsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/admin/system-settings');
  }, [router]);
  return null;
}
