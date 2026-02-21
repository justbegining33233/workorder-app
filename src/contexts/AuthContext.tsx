'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
  } | null;
  isLoading: boolean;
  login: (userData: LoginUserData) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthContextType['user']>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Public routes that don't require authentication
  const publicRoutes = ['/auth/login', '/auth/register', '/auth/thank-you', '/auth/pending-approval', '/'];

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    console.log('🔄 [AUTH] Starting authentication check...');
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
    console.log('🔍 [AUTH CHECK] Starting checkAuth...');
    // Ensure we're on the client side before accessing localStorage
    if (typeof window === 'undefined') {
      console.log('🔍 [AUTH CHECK] Server side, setting isLoading to false');
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

      console.log('🔍 [AUTH CHECK] Token exists:', !!token);
      console.log('🔍 [AUTH CHECK] Role:', role);
      console.log('🔍 [AUTH CHECK] Name:', name);
      console.log('🔍 [AUTH CHECK] ID:', id);

      // Validate token if it exists
      if (token) {
        const decodedToken = verifyToken(token);
        console.log('🔍 [AUTH CHECK] Token decoded:', decodedToken);
        if (!decodedToken) {
          // Token is invalid, clear auth data
          console.log('❌ [AUTH CHECK] Invalid token, clearing auth data');
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
        } catch (e) {
          console.warn('Error initializing socket on auth check:', e);
        }
      }

      if (role && name && id) {
        console.log('✅ [AUTH CHECK] Setting user:', { id, name, role, shopId, isShopAdmin, shopProfileComplete, isSuperAdmin });
        setUser({
          id,
          name,
          role,
          shopId: shopId || undefined,
          isShopAdmin,
          shopProfileComplete,
          isSuperAdmin,
        });
      } else {
        console.log('⚠️ [AUTH CHECK] Missing required auth data, clearing user');
        setUser(null);
        // Removed automatic redirect - let individual pages handle auth requirements
      }
    } catch (error) {
      console.error('❌ [AUTH CHECK] Auth check error:', error);
      setUser(null);
    } finally {
      console.log('🔍 [AUTH CHECK] Setting isLoading to false, user:', user ? 'set' : 'null');
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
        } catch (e) {
          console.warn('Failed to init socket client on login:', e);
        }
      }).catch(e => console.warn('Failed to import socket client on login:', e));
    } else if (user && localStorage.getItem('token')) {
      // Keep existing token if logging in without new token
      console.log('Keeping existing token');
    }

    localStorage.setItem('userRole', userData.role);
    localStorage.setItem('userName', userData.name);
    localStorage.setItem('userId', userData.id);
    if (userData.shopId) localStorage.setItem('shopId', userData.shopId);
    if (userData.isShopAdmin) localStorage.setItem('isShopAdmin', 'true');
    if (userData.shopProfileComplete) localStorage.setItem('shopProfileComplete', 'true');
    if (userData.isSuperAdmin) localStorage.setItem('isSuperAdmin', 'true');

    setUser({
      id: userData.id,
      name: userData.name,
      role: userData.role,
      shopId: userData.shopId,
      isShopAdmin: userData.isShopAdmin,
      shopProfileComplete: userData.shopProfileComplete,
      isSuperAdmin: userData.isSuperAdmin,
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
    } catch (e) {
      console.warn('Failed to disconnect socket client on logout:', e);
    }

    setUser(null);
    router.push('/auth/login');
  };

  const value = {
    user,
    isLoading,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  // If running on the server, avoid calling React hooks (useContext) during SSR
  if (typeof window === 'undefined') {
    return {
      user: null,
      isLoading: true,
      login: () => {},
      logout: () => {},
      isAuthenticated: false,
    };
  }

  const context = useContext(AuthContext);
  if (context === undefined) {
    return {
      user: null,
      isLoading: true,
      login: () => {},
      logout: () => {},
      isAuthenticated: false,
    };
  }
  return context;
}

// Hook for role-based access control
export function useRequireAuth(requiredRoles?: string[]) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  console.log('🔐 [REQUIRE AUTH] isLoading:', isLoading, 'user:', user ? user.role : 'null', 'requiredRoles:', requiredRoles);

  useEffect(() => {
    console.log('🔐 [REQUIRE AUTH] useEffect triggered - isLoading:', isLoading, 'user exists:', !!user);
    if (!isLoading && !user) {
      console.log('🔐 [REQUIRE AUTH] No user, redirecting to login');
      router.push('/auth/login');
      return;
    }

    if (!isLoading && user && requiredRoles && !requiredRoles.includes(user.role)) {
      console.log('🔐 [REQUIRE AUTH] User role not allowed, redirecting to login');
      router.push('/auth/login');
    }
  }, [user, isLoading, requiredRoles]); // Remove router from dependencies

  return { user, isLoading };
}