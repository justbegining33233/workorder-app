'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { verifyToken } from '@/lib/auth-client';

interface LoginUserData {
  id: string;
  name: string;
  role: string;
  token?: string;
  shopId?: string;
  isShopAdmin?: boolean;
  shopProfileComplete?: boolean;
  isSuperAdmin?: boolean;
}

interface AuthContextType {
  user: {
    id: string;
    name: string;
    role: string;
    shopId?: string;
    isShopAdmin?: boolean;
    shopProfileComplete?: boolean;
    isSuperAdmin?: boolean;
    onboardingCompleted?: boolean;
  } | null;
  isLoading: boolean;
  login: (userData: LoginUserData) => void;
  logout: () => void;
  isAuthenticated: boolean;
  completeOnboarding: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthContextType['user']>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Public routes that don't require authentication
  const _publicRoutes = ['/auth/login', '/auth/register', '/auth/thank-you', '/auth/pending-approval', '/'];

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    // Check authentication on app load only
    checkAuth();

    // Also check when the page becomes visible (user switches back to tab)
    // But only if we have a token to avoid unnecessary checks
    const handleVisibilityChange = () => {
      if (typeof window !== 'undefined' && !document.hidden && localStorage.getItem('token')) {
        checkAuth();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []); // Remove pathname dependency to prevent re-checking on every route change

  const checkAuth = () => {
    // Ensure we're on the client side before accessing localStorage
    if (typeof window === 'undefined') {
      setIsLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const role = localStorage.getItem('userRole');
      const name = localStorage.getItem('userName');
      const id = localStorage.getItem('userId');
      const shopId = localStorage.getItem('shopId');
      const isShopAdmin = localStorage.getItem('isShopAdmin') === 'true';
      const shopProfileComplete = localStorage.getItem('shopProfileComplete') === 'true';
      const isSuperAdmin = localStorage.getItem('isSuperAdmin') === 'true';
      const onboardingCompleted = localStorage.getItem('onboardingCompleted') === 'true';


      // Validate token if it exists
      if (token) {
        const decodedToken = verifyToken(token);
        if (!decodedToken) {
          // Token is invalid, clear auth data
          localStorage.removeItem('token');
          localStorage.removeItem('userRole');
          localStorage.removeItem('userName');
          localStorage.removeItem('userId');
          localStorage.removeItem('shopId');
          localStorage.removeItem('isShopAdmin');
          localStorage.removeItem('shopProfileComplete');
          setUser(null);
          setIsLoading(false);
          return;
        }

        // If valid token found, ensure socket is connected for real-time updates
        try {
          // dynamically import to avoid SSR issues
          import('@/lib/socket-client').then(mod => {
            const sc = mod.default;
            sc.connect(token as string);
          }).catch(e => console.warn('Failed to connect socket on auth check:', e));
        } catch {
        }
      }

      if (role && name && id) {
        setUser({
          id,
          name,
          role,
          shopId: shopId || undefined,
          isShopAdmin,
          shopProfileComplete,
          isSuperAdmin,
          onboardingCompleted,
        });
      } else {
        setUser(null);
        // Removed automatic redirect - let individual pages handle auth requirements
      }
    } catch (error) {
      console.error('âŒ [AUTH CHECK] Auth check error:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = (userData: LoginUserData) => {
    // Ensure we're on the client side before accessing localStorage
    if (typeof window === 'undefined') return;

    // If logging in with existing user data, try to refresh the token
    if (userData.token) {
      localStorage.setItem('token', userData.token);
      // Initialize socket client on login (non-blocking)
      import('@/lib/socket-client').then(mod => {
        try {
          mod.default.connect(userData.token!);
        } catch {
        }
      }).catch(e => console.warn('Failed to import socket client on login:', e));
    } else if (user && localStorage.getItem('token')) {
      // Keep existing token if logging in without new token
    }

    localStorage.setItem('userRole', userData.role);
    localStorage.setItem('userName', userData.name);
    localStorage.setItem('userId', userData.id);
    if (userData.shopId) localStorage.setItem('shopId', userData.shopId);
    else localStorage.removeItem('shopId');
    if (userData.isShopAdmin) localStorage.setItem('isShopAdmin', 'true');
    else localStorage.removeItem('isShopAdmin');
    // Always explicitly set or clear shopProfileComplete to prevent stale state
    if (userData.shopProfileComplete) localStorage.setItem('shopProfileComplete', 'true');
    else localStorage.removeItem('shopProfileComplete');
    if (userData.isSuperAdmin) localStorage.setItem('isSuperAdmin', 'true');
    else localStorage.removeItem('isSuperAdmin');

    setUser({
      id: userData.id,
      name: userData.name,
      role: userData.role,
      shopId: userData.shopId,
      isShopAdmin: userData.isShopAdmin,
      shopProfileComplete: userData.shopProfileComplete,
      isSuperAdmin: userData.isSuperAdmin,
      onboardingCompleted: localStorage.getItem('onboardingCompleted') === 'true',
    });
  };

  const logout = async () => {
    // Ensure we're on the client side before accessing localStorage
    if (typeof window === 'undefined') return;

    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('userId');
    localStorage.removeItem('shopId');
    localStorage.removeItem('isShopAdmin');
    localStorage.removeItem('shopProfileComplete');
    localStorage.removeItem('token');

    try {
      const { default: socketClient } = await import('@/lib/socket-client');
      socketClient.disconnect();
    } catch {
    }

    setUser(null);
    router.push('/auth/login' as Route);
  };

  const completeOnboarding = () => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('onboardingCompleted', 'true');
    setUser(prev => prev ? { ...prev, onboardingCompleted: true } : null);
  };

  const value = {
    user,
    isLoading,
    login,
    logout,
    isAuthenticated: !!user,
    completeOnboarding,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  // On the server or outside a provider, return a safe default
  if (typeof window === 'undefined' || context === undefined) {
    return {
      user: null,
      isLoading: true,
      login: () => {},
      logout: () => {},
      isAuthenticated: false,
      completeOnboarding: () => {},
    };
  }
  return context;
}

/** Where each role belongs  -  must mirror src/middleware.ts */
const ROLE_HOME_MAP: Record<string, string> = {
  admin:      '/admin/home',
  superadmin: '/superadmin/dashboard',
  shop:       '/shop/home',
  manager:    '/shop/home',
  tech:       '/tech/home',
  customer:   '/customer/dashboard',
};

// Hook for role-based access control
export function useRequireAuth(requiredRoles?: string[]) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login' as Route);
      return;
    }

    if (!isLoading && user && requiredRoles && !requiredRoles.includes(user.role)) {
      // Redirect to the user's own section, not to login
      const home = ROLE_HOME_MAP[user.role] ?? '/auth/login';
      router.push(home as Route);
    }
  }, [user, isLoading, requiredRoles]); // Remove router from dependencies

  return { user, isLoading };
}
