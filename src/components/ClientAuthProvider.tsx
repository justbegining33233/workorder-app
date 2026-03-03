"use client";

import React from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import IdleTimeoutProvider from '@/components/IdleTimeoutProvider';

export default function ClientAuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <IdleTimeoutProvider>
        {children}
      </IdleTimeoutProvider>
    </AuthProvider>
  );
}
