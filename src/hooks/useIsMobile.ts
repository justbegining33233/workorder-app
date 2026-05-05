'use client';
import { useState, useEffect } from 'react';

export function useIsMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState(false);
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
