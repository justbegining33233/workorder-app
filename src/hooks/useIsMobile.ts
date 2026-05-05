'use client';
import { useState, useEffect } from 'react';
import { useIsMobileUA } from '@/context/NativeContext';

export function useIsMobile(breakpoint = 768): boolean {
  // Seed the initial state from the server-detected UA flag so the very first
  // render already knows it's mobile — no desktop→mobile flash on load.
  const serverMobile = useIsMobileUA();
  const [isMobile, setIsMobile] = useState(serverMobile);

  useEffect(() => {
    // Always treat native Capacitor app as mobile regardless of screen width
    const isNativeApp = typeof window !== 'undefined' &&
      (window.hasOwnProperty('Capacitor') || (window as any).Capacitor?.isNativePlatform?.());
    const check = () => setIsMobile(isNativeApp || window.innerWidth < breakpoint);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [breakpoint]);
  return isMobile;
}
