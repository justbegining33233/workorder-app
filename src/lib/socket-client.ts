import { io, Socket } from 'socket.io-client';

class SocketClient {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect(token: string) {
    if (this.socket?.connected) {
      return this.socket;
    }

    // Connect to the in-app Socket.IO path by default (uses same origin)
    // Fallback to NEXT_PUBLIC_SOCKET_URL or http://localhost:3001 if the in-app path fails
    const primaryUrl = process.env.NEXT_PUBLIC_SOCKET_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
    const fallbackUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

    this.socket = io(primaryUrl, {
      path: '/api/socket',
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 1,
      timeout: 10000, // Increased from 5000 to 10000ms
    });

    // If connection fails to primary, attempt fallback
    this.socket.on('connect_error', (err) => {
      console.warn('Primary socket connect_error, attempting fallback:', err && err.message);
      try {
        this.socket?.disconnect();
      } catch (e) {}
      // Ensure fallback uses the same server path
      this.socket = io(fallbackUrl, { path: '/api/socket', auth: { token }, transports: ['websocket','polling'], timeout: 10000 }); // Increased timeout
      this.setupEventHandlers();
    });

    this.setupEventHandlers();
    return this.socket;
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to socket server');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from socket:', reason);
      this.handleReconnect();
    });

    this.socket.on('connect_error', (error) => {
      console.warn('Socket connection error (will retry):', error?.message || 'Unknown error');
      this.handleReconnect();
    });

    this.socket.on('connect_timeout', () => {
      console.warn('Socket connection timeout (will retry)');
      this.handleReconnect();
    });

    // Server events (use canonical event names)
    this.socket.on('work-order-updated', (data) => {
      console.log('Work order updated:', data);
      window.dispatchEvent(new CustomEvent('work-order:updated', { detail: data }));
    });

    this.socket.on('new-message', (data) => {
      console.log('New chat message:', data);
      window.dispatchEvent(new CustomEvent('chat:new-message', { detail: data }));
    });

    this.socket.on('user-typing', (data) => {
      window.dispatchEvent(new CustomEvent('chat:typing', { detail: data }));
    });

    this.socket.on('user-stopped-typing', (data) => {
      window.dispatchEvent(new CustomEvent('chat:stopped-typing', { detail: data }));
    });

    this.socket.on('tech-location-updated', (data) => {
      window.dispatchEvent(new CustomEvent('tech:location_updated', { detail: data }));
    });

    this.socket.on('clock-status-changed', (data) => {
      window.dispatchEvent(new CustomEvent('clock:status_changed', { detail: data }));
    });

    // Error handling
    this.socket.on('error', (data) => {
      console.error('Socket error:', data);
      window.dispatchEvent(new CustomEvent('socket:error', { detail: data }));
    });
  }

  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    setTimeout(() => {
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      this.socket?.connect();
    }, delay);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Work order methods
  updateWorkOrderStatus(workOrderId: string, status: string, updatedBy: string, shopId?: string) {
    this.socket?.emit('work-order-update', { workOrderId, status, updatedBy, shopId });
  }

  // Chat methods
  sendMessage(workOrderId: string, message: string, senderId: string, senderRole: string, receiverId?: string, receiverRole?: string) {
    this.socket?.emit('send-message', { workOrderId, message, senderId, senderRole, receiverId, receiverRole });
  }

  setTyping(workOrderId: string, isTyping: boolean, receiverId?: string) {
    this.socket?.emit(isTyping ? 'typing-start' : 'typing-stop', { workOrderId, receiverId });
  }

  // Location methods
  updateLocation(latitude: number, longitude: number, accuracy?: number) {
    this.socket?.emit('location-update', { latitude, longitude, accuracy });
  }

  // Location update for a specific work order (includes workOrderId so customers can receive only their assigned job updates)
  updateLocationForWorkOrder(workOrderId: string, latitude: number, longitude: number, accuracy?: number) {
    this.socket?.emit('location-update', { workOrderId, latitude, longitude, accuracy });
  }

  // Utility methods
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getSocket(): Socket | null {
    return this.socket;
  }
}

// Export singleton instance
export const socketClient = new SocketClient();
export default socketClient;