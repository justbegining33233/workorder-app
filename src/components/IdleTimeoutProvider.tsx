"use client";

import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useIdleTimeout } from '@/hooks/useIdleTimeout';
import IdleWarningModal from '@/components/IdleWarningModal';

const WARN_SECONDS = 30;

export default function IdleTimeoutProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, logout } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(WARN_SECONDS);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopCountdown = useCallback(() => {
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
  }, []);

  const startCountdown = useCallback(() => {
    setSecondsLeft(WARN_SECONDS);
    countdownRef.current = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) { stopCountdown(); return 0; }
        return s - 1;
      });
    }, 1000);
  }, [stopCountdown]);

  const handleWarning = useCallback(() => {
    setShowWarning(true);
    startCountdown();
  }, [startCountdown]);

  const handleIdle = useCallback(() => {
    stopCountdown();
    setShowWarning(false);
    logout();
  }, [logout, stopCountdown]);

  const handleActive = useCallback(() => {
    stopCountdown();
    setShowWarning(false);
    setSecondsLeft(WARN_SECONDS);
  }, [stopCountdown]);

  const handleStay = useCallback(() => {
    handleActive();
    // reset timers by dispatching a synthetic activity event
    window.dispatchEvent(new MouseEvent('mousemove'));
  }, [handleActive]);

  useIdleTimeout({
    onWarning: handleWarning,
    onIdle: handleIdle,
    onActive: handleActive,
    enabled: isAuthenticated,
  });

  // Clean up on unmount
  useEffect(() => () => stopCountdown(), [stopCountdown]);

  return (
    <>
      {children}
      {showWarning && isAuthenticated && (
        <IdleWarningModal
          secondsLeft={secondsLeft}
          onStay={handleStay}
          onLogout={handleIdle}
        />
      )}
    </>
  );
}
