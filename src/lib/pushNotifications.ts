// Web Push Notification Service for Browser Notifications

let pushSubscription: PushSubscription | null = null;

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return false;
  }

  if (!('serviceWorker' in navigator)) {
    console.warn('This browser does not support service workers');
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

export async function subscribeToPushNotifications(): Promise<PushSubscription | null> {
  try {
    const registration = await navigator.serviceWorker.ready;
    
    // Check if already subscribed
    const existingSubscription = await registration.pushManager.getSubscription();
    if (existingSubscription) {
      pushSubscription = existingSubscription;
      return existingSubscription;
    }

    // Subscribe to push notifications
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
      ) as BufferSource,
    });

    pushSubscription = subscription;
    
    // Send subscription to server
    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription),
    });

    return subscription;
  } catch (error) {
    console.error('Failed to subscribe to push notifications:', error);
    return null;
  }
}

export async function unsubscribeFromPushNotifications(): Promise<boolean> {
  try {
    if (pushSubscription) {
      await pushSubscription.unsubscribe();
      
      // Notify server
      await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pushSubscription),
      });
      
      pushSubscription = null;
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to unsubscribe from push notifications:', error);
    return false;
  }
}

export async function showNotification(title: string, options?: any) {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return;
  }

  if (Notification.permission === 'granted') {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(title, {
      icon: '/icon-192x192.png',
      badge: '/icon-96x96.png',
      vibrate: [200, 100, 200],
      ...options,
    });
  }
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Notification templates
export const NotificationTemplates = {
  appointmentConfirmed: (date: string) => ({
    title: 'Appointment Confirmed',
    body: `Your appointment is confirmed for ${date}`,
    icon: '/icons/calendar.png',
    tag: 'appointment',
  }),

  techEnRoute: (techName: string, eta: string) => ({
    title: 'Tech is On the Way!',
    body: `${techName} is en route. ETA: ${eta}`,
    icon: '/icons/truck.png',
    tag: 'tracking',
  }),

  techArrived: (techName: string) => ({
    title: 'Tech Has Arrived',
    body: `${techName} has arrived at your location`,
    icon: '/icons/check.png',
    tag: 'tracking',
  }),

  newMessage: (senderName: string, preview: string) => ({
    title: `Message from ${senderName}`,
    body: preview,
    icon: '/icons/message.png',
    tag: 'message',
    requireInteraction: true,
  }),

  estimateReady: (amount: number) => ({
    title: 'Estimate Ready for Review',
    body: `Your service estimate of $${amount.toFixed(2)} is ready for approval`,
    icon: '/icons/invoice.png',
    tag: 'estimate',
    requireInteraction: true,
  }),

  workCompleted: (workOrderTitle: string) => ({
    title: 'Service Completed',
    body: `${workOrderTitle} has been completed`,
    icon: '/icons/success.png',
    tag: 'completion',
  }),

  paymentReceived: (amount: number) => ({
    title: 'Payment Received',
    body: `Payment of $${amount.toFixed(2)} has been processed`,
    icon: '/icons/payment.png',
    tag: 'payment',
  }),
};
