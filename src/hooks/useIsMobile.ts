'use client';
import { useState, useEffect } from 'react';
import { useIsMobileUA } from '@/context/NativeContext';

/**
 * Determines mobile on the client side using this priority order:
 * 1. Capacitor native app → always mobile
 * 2. navigator.userAgent → respects the browser's own "Request Desktop / Mobile Site" toggle
 * 3. window.innerWidth fallback (catches responsive/PWA cases)
 *
 * Using UA as the primary signal means:
 * - Phone with default settings → mobile view
 * - Phone with "Request Desktop Site" → UA changes to desktop → web view
 * - Desktop with DevTools mobile emulation / "Request Mobile Site" → UA changes → mobile view
 * - Capacitor APK → always mobile regardless of reported viewport
 */
function detectMobileClient(breakpoint: number): boolean {
  if (typeof window === 'undefined') return false;
  // Native Capacitor app → always mobile
  const isNative =
    window.hasOwnProperty('Capacitor') ||
    !!(window as any).Capacitor?.isNativePlatform?.();
  if (isNative) return true;
  // Browser UA is the authoritative signal — it changes when the user
  // toggles "Request Desktop Site" / "Request Mobile Site"
  const isMobileUA = /Mobile|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  // Also catch narrow viewports (PWA, responsive, or desktop DevTools)
  return isMobileUA || window.innerWidth < breakpoint;
}

export function useIsMobile(breakpoint = 768): boolean {
  // Server-detected UA seeds the initial state so the first render is already
  // correct — no desktop→mobile flash on load.
  const serverMobile = useIsMobileUA();
  const [isMobile, setIsMobile] = useState(serverMobile);

  useEffect(() => {
    const check = () => setIsMobile(detectMobileClient(breakpoint));
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [breakpoint]);

  return isMobile;
}
