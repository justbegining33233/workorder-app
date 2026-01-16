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

    this.socket = io(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000', {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    this.setupEventHandlers();
    return this.socket;
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected:', reason);
      this.handleReconnect();
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      this.handleReconnect();
    });

    // Work order events
    this.socket.on('workorder:updated', (data) => {
      console.log('Work order updated:', data);
      // Dispatch to React components
      window.dispatchEvent(new CustomEvent('workorder:updated', { detail: data }));
    });

    // Chat events
    this.socket.on('chat:message', (data) => {
      console.log('New chat message:', data);
      window.dispatchEvent(new CustomEvent('chat:message', { detail: data }));
    });

    this.socket.on('chat:typing', (data) => {
      window.dispatchEvent(new CustomEvent('chat:typing', { detail: data }));
    });

    // Tech location events
    this.socket.on('tech:location_updated', (data) => {
      window.dispatchEvent(new CustomEvent('tech:location_updated', { detail: data }));
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
  updateWorkOrderStatus(workOrderId: string, status: string, updatedBy: string) {
    this.socket?.emit('workorder:status_update', { workOrderId, status, updatedBy });
  }

  // Chat methods
  sendMessage(workOrderId: string, message: string, senderId: string, senderRole: string) {
    this.socket?.emit('chat:send', { workOrderId, message, senderId, senderRole });
  }

  setTyping(workOrderId: string, isTyping: boolean) {
    this.socket?.emit('chat:typing', { workOrderId, isTyping });
  }

  // Location methods
  updateLocation(latitude: number, longitude: number, accuracy?: number) {
    this.socket?.emit('location:update', { latitude, longitude, accuracy });
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