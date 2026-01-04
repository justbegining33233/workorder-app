// In-memory notification store
import { Notification } from '@/types/customer';

const notifications: Map<string, Notification[]> = new Map();

export function getNotifications(customerId?: string): Notification[] {
  if (!customerId) return [];
  return notifications.get(customerId) || [];
}

export function addNotification(customerId: string, notification: Omit<Notification, 'id' | 'createdAt'>): Notification {
  const newNotification: Notification = {
    ...notification,
    id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date(),
  };
  
  const userNotifs = notifications.get(customerId) || [];
  notifications.set(customerId, [newNotification, ...userNotifs]);
  
  // Simulate sending based on delivery method
  if (notification.deliveryMethod.includes('email')) {
    console.log(`[EMAIL] To ${customerId}: ${notification.title}`);
  }
  if (notification.deliveryMethod.includes('sms')) {
    console.log(`[SMS] To ${customerId}: ${notification.message}`);
  }
  if (notification.deliveryMethod.includes('push')) {
    console.log(`[PUSH] To ${customerId}: ${notification.title}`);
  }
  
  return newNotification;
}

export function markAsRead(customerId: string, notificationId: string): boolean {
  const userNotifs = notifications.get(customerId);
  if (!userNotifs) return false;
  
  const notif = userNotifs.find(n => n.id === notificationId);
  if (notif) {
    notif.read = true;
    return true;
  }
  return false;
}

export function markAllAsRead(customerId: string): void {
  const userNotifs = notifications.get(customerId);
  if (userNotifs) {
    userNotifs.forEach(n => n.read = true);
  }
}

export function deleteNotification(customerId: string, notificationId: string): boolean {
  const userNotifs = notifications.get(customerId);
  if (!userNotifs) return false;
  
  const index = userNotifs.findIndex(n => n.id === notificationId);
  if (index > -1) {
    userNotifs.splice(index, 1);
    return true;
  }
  return false;
}

// Helper to create work order status notifications
export function notifyStatusChange(customerId: string, workOrderId: string, oldStatus: string, newStatus: string) {
  const messages: Record<string, string> = {
    'pending': 'Your work order has been received and is pending assignment.',
    'in-progress': 'Your technician has started working on your vehicle!',
    'waiting-for-payment': 'Work is complete! Please review and submit payment.',
    'closed': 'Your work order has been completed. Thank you!',
    'denied-estimate': 'Your estimate was not approved.',
  };
  
  addNotification(customerId, {
    type: 'status_change',
    title: 'Work Order Status Updated',
    message: messages[newStatus] || `Status changed from ${oldStatus} to ${newStatus}`,
    workOrderId,
    read: false,
    deliveryMethod: ['email', 'sms', 'push'],
  });
}
