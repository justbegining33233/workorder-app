import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

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

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      // Improved connection flow: try in-app '/api/socket' first, then fallback to external socket server.
      const primaryUrl = typeof window !== 'undefined' ? `${window.location.origin}` : 'http://localhost:3000';
      const fallbackUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
      let attemptedFallback = false;

      const createSocket = (url: string, path?: string) => {
        console.log('[socket] createSocket', url, path || '(default path)');
        const opts: any = {
          auth: { token },
          transports: ['websocket', 'polling'],
          reconnectionAttempts: 5,
          timeout: 5000,
        };
        if (path) opts.path = path;

        const s = io(url, opts);
        socketRef.current = s as any;
        socket = s as any;

        s.on('connect', () => {
          console.log('[socket] connected to', url, 'id', s.id);
          setIsConnected(true);
        });

        s.on('disconnect', (reason) => {
          console.log('[socket] disconnected from', url, reason);
          setIsConnected(false);
        });

        s.on('connect_error', (err) => {
          console.error('[socket] connect_error to', url, err && err.message ? err.message : err);
          setIsConnected(false);

          // Try fallback once when primary fails
          if (!attemptedFallback && url === primaryUrl) {
            attemptedFallback = true;
            console.log('[socket] attempting fallback to', fallbackUrl, '/api/socket');
            try { s.disconnect(); } catch (e) {}
            createSocket(fallbackUrl, '/api/socket'); // ensure fallback uses /api/socket path
          }
        });

        // wire server events to global window events so components can listen
        s.on('work-order-updated', (data) => { window.dispatchEvent(new CustomEvent('work-order:updated', { detail: data })); });
        s.on('new-message', (data) => { window.dispatchEvent(new CustomEvent('chat:new-message', { detail: data })); });
        s.on('user-typing', (data) => { window.dispatchEvent(new CustomEvent('chat:typing', { detail: data })); });
        s.on('user-stopped-typing', (data) => { window.dispatchEvent(new CustomEvent('chat:stopped-typing', { detail: data })); });
        s.on('tech-location-updated', (data) => { window.dispatchEvent(new CustomEvent('tech:location_updated', { detail: data })); });
        s.on('clock-status-changed', (data) => { window.dispatchEvent(new CustomEvent('clock:status_changed', { detail: data })); });

        return s;
      };

      // Start with in-app path
      createSocket(primaryUrl, '/api/socket');

      return () => {
        try {
          if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
            socket = null;
            setIsConnected(false);
          }
        } catch (e) {
          // ignore
        }
      };
    } catch (error) {
      console.error('Failed to initialize socket connection:', error);
      return;
    }
  }, []);

  const emit = (event: keyof ClientToServerEvents, data: any) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit(event, data);
    } else {
      console.warn('Socket not connected, cannot emit:', event);
    }
  };

  const on = (event: keyof ServerToClientEvents, callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
  };

  const off = (event: keyof ServerToClientEvents, callback?: (data: any) => void) => {
    if (socketRef.current) {
      if (callback) {
        socketRef.current.off(event, callback);
      } else {
        socketRef.current.off(event);
      }
    }
  };

  return {
    isConnected,
    emit,
    on,
    off,
  };
};