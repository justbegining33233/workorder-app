'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

/** Where each role belongs — must mirror src/middleware.ts */
const ROLE_HOME: Record<string, string> = {
  admin:      '/admin/home',
  superadmin: '/admin/home',
  shop:       '/shop/home',
  manager:    '/shop/home',
  tech:       '/tech/home',
  customer:   '/customer/dashboard',
};

export default function useRequireAuth(allowedRoles?: string[]) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/auth/login');
        return;
      }

      if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        // Redirect to the user's own section, not to login
        const home = ROLE_HOME[user.role] ?? '/auth/login';
        router.push(home);
        return;
      }
    }
  }, [isAuthenticated, isLoading, user, allowedRoles, router]);

  return { user, isLoading };
}