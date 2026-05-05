'use client';

import { createContext, useContext } from 'react';

interface NativeContextValue {
  isNative: boolean;
  platform: 'android' | 'ios' | null;
}

const NativeContext = createContext<NativeContextValue>({
  isNative: false,
  platform: null,
});

export function NativeProvider({
  children,
  isNative,
  platform,
}: {
  children: React.ReactNode;
  isNative: boolean;
  platform: 'android' | 'ios' | null;
}) {
  return (
    <NativeContext.Provider value={{ isNative, platform }}>
      {children}
    </NativeContext.Provider>
  );
}

export function useIsNative(): boolean {
  return useContext(NativeContext).isNative;
}

export function useNativePlatform(): 'android' | 'ios' | null {
  return useContext(NativeContext).platform;
}
