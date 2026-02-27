/**
 * Server-side push notification sender.
 * Retrieves stored PushSubscription from DB and sends via web-push.
 * Requires VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_EMAIL env vars.
 */
import webpush from 'web-push';
import prisma from '@/lib/prisma';

// Configure VAPID once at module load
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_EMAIL || 'admin@fixtray.com'}`,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  requireInteraction?: boolean;
  data?: Record<string, unknown>;
}

/**
 * Send a push notification to a specific customer.
 * Silently fails (logs) if no subscription is found or VAPID not configured.
 */
export async function sendPushToCustomer(customerId: string, payload: PushPayload): Promise<void> {
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    return;
  }

  try {
    const record = await prisma.pushSubscription.findUnique({
      where: { customerId },
    });

    if (!record?.subscription) {
      return;
    }

    const subscription = JSON.parse(record.subscription);
    await webpush.sendNotification(subscription, JSON.stringify(payload));
  } catch (err: unknown) {
    // web-push sets statusCode=410 when the subscription has expired
    if (typeof err === 'object' && err !== null && (err as { statusCode?: number }).statusCode === 410) {
      // Subscription expired — clean it up
      await prisma.pushSubscription.delete({ where: { customerId } }).catch(() => {});
    } else {
      console.error('[Push] Error sending to customer', customerId, err);
    }
  }
}

// â”€â”€ Typed notification helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function pushEstimateReady(customerId: string, amount: number, workOrderId: string) {
  return sendPushToCustomer(customerId, {
    title: '📋 Estimate Ready for Review',
    body: `Your service estimate of $${amount.toFixed(2)} is ready. Tap to review and pay.`,
    tag: 'estimate',
    requireInteraction: true,
    data: { workOrderId, url: `/customer/workorders/${workOrderId}` },
  });
}

export async function pushJobCompleted(customerId: string, totalDue: number, workOrderId: string) {
  return sendPushToCustomer(customerId, {
    title: '🎉 Your Vehicle Is Ready!',
    body: `Service complete. Amount due: $${totalDue.toFixed(2)}. Tap to pay now.`,
    tag: 'completion',
    requireInteraction: true,
    data: { workOrderId, url: `/customer/workorders/${workOrderId}` },
  });
}

export async function pushPaymentConfirmed(customerId: string, amountPaid: number, workOrderId: string) {
  return sendPushToCustomer(customerId, {
    title: '✅ Payment Confirmed',
    body: `Your payment of $${amountPaid.toFixed(2)} was received. Thank you!`,
    tag: 'payment',
    data: { workOrderId, url: `/customer/workorders/${workOrderId}` },
  });
}

export async function pushTechEnRoute(customerId: string, techName: string, workOrderId: string) {
  return sendPushToCustomer(customerId, {
    title: '🚗 Tech is On the Way!',
    body: `${techName} is heading to your location now.`,
    tag: 'tracking',
    data: { workOrderId, url: `/customer/workorders/${workOrderId}` },
  });
}

export async function pushRecurringServiceDue(customerId: string, serviceName: string) {
  return sendPushToCustomer(customerId, {
    title: `📋 ${serviceName} Is Due`,
    body: 'Tap to confirm or skip — no bay reserved until you say yes.',
    tag: 'recurring-approval',
    requireInteraction: true,
    data: { url: '/customer/recurring-approvals' },
  });
}
