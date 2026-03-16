/**
 * useSocket — polling-based real-time hook (Vercel-compatible, no Socket.io)
 *
 * Every 5 seconds it fetches work orders and messages from Neon via the
 * existing API routes.  When changes are detected it fires the same
 * window CustomEvents that the rest of the app already listens for:
 *
 *   work-order:updated   → triggered when any work order status/updatedAt changes
 *   chat:new-message     → triggered when an unread conversation appears
 *   chat:typing          → (stub — no real-time typing without persistent WS)
 *   chat:stopped-typing  → (stub)
 *   tech:location_updated→ (stub)
 *   clock:status_changed → (stub — clock status polled independently in TopNavBar)
 *
 * The hook's `on` / `off` helpers translate socket event names into the above
 * window event names so that components relying on on('new-message', cb) keep
 * working without any changes.
 *
 * `emit` is a no-op stub; all actual mutations already go through REST endpoints.
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

// ─── Socket → Window event name mapping ──────────────────────────────────────
const EVENT_MAP: Record<string, string> = {
  'work-order-updated':    'work-order:updated',
  'new-message':           'chat:new-message',
  'user-typing':           'chat:typing',
  'user-stopped-typing':   'chat:stopped-typing',
  'tech-location-updated': 'tech:location_updated',
  'clock-status-changed':  'clock:status_changed',
};

// ─── Types (kept for compatibility) ──────────────────────────────────────────
export interface ServerToClientEvents {
  'work-order-updated': (data: any) => void;
  'new-message': (data: any) => void;
  'user-typing': (data: any) => void;
  'user-stopped-typing': (data: any) => void;
  'tech-location-updated': (data: any) => void;
  'clock-status-changed': (data: any) => void;
}

export interface ClientToServerEvents {
  'work-order-update': (data: any) => void;
  'send-message': (data: any) => void;
  'typing-start': (data: any) => void;
  'typing-stop': (data: any) => void;
  'location-update': (data: any) => void;
  'clock-status-change': (data: any) => void;
}

// ─── Helper: dispatch a window CustomEvent ───────────────────────────────────
function dispatch(windowEvent: string, detail: unknown) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(windowEvent, { detail }));
  }
}

// ─── Polling state (module-level singleton so multiple hook instances share it)
let pollingInterval: ReturnType<typeof setInterval> | null = null;
let prevWorkOrderSnapshot: Record<string, string> = {}; // id → updatedAt
let prevMessageSnapshot: Record<string, string> = {};   // contactId → lastMessageAt

async function poll() {
  if (typeof window === 'undefined') return;
  const token = localStorage.getItem('token');
  if (!token) return;

  const headers = { Authorization: `Bearer ${token}` };

  // ── Work orders ────────────────────────────────────────────────────────────
  try {
    const res = await fetch('/api/workorders', { headers, credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      const orders: any[] = data.workOrders ?? data ?? [];
      const next: Record<string, string> = {};

      for (const wo of orders) {
        const stamp = wo.updatedAt ?? wo.createdAt ?? '';
        next[wo.id] = stamp;
        const prev = prevWorkOrderSnapshot[wo.id];
        if (prev !== undefined && prev !== stamp) {
          // Status changed — fire event
          dispatch('work-order:updated', {
            workOrderId: wo.id,
            action: 'updated',
            status: wo.status,
            updatedBy: wo.assignedTo ?? 'system',
            timestamp: stamp,
          });
        }
      }
      prevWorkOrderSnapshot = next;
    }
  } catch {
    // network error — silently ignore
  }

  // ── Messages ───────────────────────────────────────────────────────────────
  try {
    const res = await fetch('/api/messages', { headers, credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      const conversations: any[] = data.conversations ?? [];
      const next: Record<string, string> = {};

      for (const conv of conversations) {
        const key = conv.contactId ?? conv.id ?? '';
        const stamp = conv.lastMessageAt ?? '';
        next[key] = stamp;
        const prev = prevMessageSnapshot[key];
        if (prev !== undefined && prev !== stamp && conv.unreadCount > 0) {
          dispatch('chat:new-message', {
            from: conv.contactId,
            fromName: conv.contactName,
            content: conv.lastMessage,
            timestamp: stamp,
          });
        }
      }
      prevMessageSnapshot = next;
    }
  } catch {
    // network error — silently ignore
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export const useSocket = () => {
  const [isConnected] = useState(true); // polling is always "connected"
  // Track window-event listeners so on/off work correctly
  const listenersRef = useRef<Map<string, (e: Event) => void>>(new Map());

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Start the shared polling interval (once globally)
    if (!pollingInterval) {
      // Kick off first poll immediately, then every 5 s
      poll();
      pollingInterval = setInterval(poll, 5000);
    }

    return () => {
      // We intentionally leave the interval running — TopNavBar mounts/unmounts
      // on every page navigation; stopping polling on unmount would break other
      // components that still need live data.
    };
  }, []);

  const emit = useCallback((_event: keyof ClientToServerEvents, _data: any) => {
    // No-op: all mutations are handled by dedicated REST endpoints.
    // clock-status-change → already handled by /api/shop/team/clock
    // send-message        → RealTimeMessaging uses its own API call
  }, []);

  const on = useCallback((event: keyof ServerToClientEvents, callback: (data: any) => void) => {
    const windowEvent = EVENT_MAP[event];
    if (!windowEvent || typeof window === 'undefined') return;
    const wrapper = (e: Event) => callback((e as CustomEvent).detail);
    // Key: event name + callback ref to support clean removal
    const key = `${event}:${callback.toString().slice(0, 40)}`;
    listenersRef.current.set(key, wrapper);
    window.addEventListener(windowEvent, wrapper);
  }, []);

  const off = useCallback((event: keyof ServerToClientEvents, callback?: (data: any) => void) => {
    const windowEvent = EVENT_MAP[event];
    if (!windowEvent || typeof window === 'undefined') return;

    if (callback) {
      const key = `${event}:${callback.toString().slice(0, 40)}`;
      const wrapper = listenersRef.current.get(key);
      if (wrapper) {
        window.removeEventListener(windowEvent, wrapper);
        listenersRef.current.delete(key);
      }
    } else {
      // Remove all listeners for this event
      listenersRef.current.forEach((wrapper, key) => {
        if (key.startsWith(`${event}:`)) {
          window.removeEventListener(windowEvent, wrapper);
          listenersRef.current.delete(key);
        }
      });
    }
  }, []);

  return { isConnected, emit, on, off };
};

