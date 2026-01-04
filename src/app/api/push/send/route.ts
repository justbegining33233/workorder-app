import { NextResponse } from 'next/server';
import webpush from 'web-push';

// Configure web-push with VAPID keys
webpush.setVapidDetails(
  'mailto:' + process.env.VAPID_EMAIL || 'admin@example.com',
  process.env.VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || ''
);

// POST /api/push/send - Send push notification
export async function POST(request: Request) {
  try {
    const body = await request.json();
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
  } catch (error: any) {
    console.error('Error sending push notification:', error);
    
    if (error.statusCode === 410) {
      // Subscription has expired or is no longer valid
      return NextResponse.json({ error: 'Subscription expired' }, { status: 410 });
    }

    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 });
  }
}
