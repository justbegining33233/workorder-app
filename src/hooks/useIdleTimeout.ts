"use client";

import { useEffect, useRef, useCallback } from 'react';

const IDLE_MS = 5 * 60 * 1000;      // 5 minutes until logout
const WARN_MS = 30 * 1000;           // show warning 30 seconds before logout

interface Options {
  onIdle: () => void;       // called when countdown hits 0
  onWarning: () => void;    // called when warning countdown starts
  onActive: () => void;     // called when user becomes active again (dismisses warning)
  enabled: boolean;
}

export function useIdleTimeout({ onIdle, onWarning, onActive, enabled }: Options) {
  const warnTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isWarning = useRef(false);

  const clearTimers = useCallback(() => {
    if (warnTimer.current) { clearTimeout(warnTimer.current); warnTimer.current = null; }
    if (idleTimer.current) { clearTimeout(idleTimer.current); idleTimer.current = null; }
  }, []);

  const resetTimers = useCallback(() => {
    if (!enabled) return;
    clearTimers();
    if (isWarning.current) {
      isWarning.current = false;
      onActive();
    }
    warnTimer.current = setTimeout(() => {
      isWarning.current = true;
      onWarning();
      idleTimer.current = setTimeout(() => {
        isWarning.current = false;
        onIdle();
      }, WARN_MS);
    }, IDLE_MS - WARN_MS);
  }, [enabled, clearTimers, onIdle, onWarning, onActive]);

  useEffect(() => {
    if (!enabled) return;

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    const handler = () => resetTimers();

    events.forEach(e => window.addEventListener(e, handler, { passive: true }));
    resetTimers();

    return () => {
      events.forEach(e => window.removeEventListener(e, handler));
      clearTimers();
    };
  }, [enabled, resetTimers, clearTimers]);
}
