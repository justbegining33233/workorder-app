import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { requireRole } from '@/lib/auth';

// Configure web-push with VAPID keys (only if available)
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:' + (process.env.VAPID_EMAIL || 'admin@example.com'),
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

// POST /api/push/send - Send push notification (shop, manager or admin only)
export async function POST(request: NextRequest) {
  const auth = requireRole(request, ['shop', 'manager', 'admin']);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json().catch(() => null);
    if (!body) return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });

    const { subscription, notification } = body;

    if (!subscription || !notification) {
      return NextResponse.json(
        { error: 'Subscription and notification required' },
        { status: 400 }
      );
    }

    const payload = JSON.stringify(notification);

    await webpush.sendNotification(subscription, payload);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error sending push notification:', error);

    if (typeof error === 'object' && error !== null && 'statusCode' in error && (error as { statusCode: number }).statusCode === 410) {
      // Subscription has expired or is no longer valid
      return NextResponse.json({ error: 'Subscription expired' }, { status: 410 });
    }

    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 });
  }
}
