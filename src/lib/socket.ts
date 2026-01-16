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

    // Initialize socket connection
    socket = io({
      path: '/api/socket',
      auth: {
        token,
      },
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to WebSocket server');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setIsConnected(false);
    });

    return () => {
      if (socket) {
        socket.disconnect();
        socket = null;
        socketRef.current = null;
      }
    };
  }, []);

  const emit = (event: keyof ClientToServerEvents, data: any) => {
    if (socket && socket.connected) {
      socket.emit(event, data);
    }
  };

  const on = (event: keyof ServerToClientEvents, callback: (data: any) => void) => {
    if (socket) {
      socket.on(event, callback);
    }
  };

  const off = (event: keyof ServerToClientEvents, callback?: (data: any) => void) => {
    if (socket) {
      if (callback) {
        socket.off(event, callback);
      } else {
        socket.off(event);
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