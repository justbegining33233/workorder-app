import { NextRequest, NextResponse } from 'next/server';
import { getNotifications, markAsRead, markAllAsRead, deleteNotification } from '@/lib/notifications';
import { requireAuth } from '@/lib/middleware';
import { validateCsrf } from '@/lib/csrf';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const customerId = searchParams.get('customerId') || 'demo-customer';
  
  const notifications = getNotifications(customerId);
  return NextResponse.json(notifications);
}

export async function PATCH(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  // Require CSRF when using cookie-based auth
  if (!request.headers.get('authorization')) {
    const ok = await validateCsrf(request);
    if (!ok) return NextResponse.json({ error: 'CSRF validation failed' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const customerId = searchParams.get('customerId') || auth.id;
  const notificationId = searchParams.get('id');
  const action = searchParams.get('action');

  if (action === 'markAllRead') {
    markAllAsRead(customerId);
    return NextResponse.json({ success: true });
  }

  if (notificationId) {
    const success = markAsRead(customerId, notificationId);
    return NextResponse.json({ success });
  }

  return NextResponse.json({ success: false }, { status: 400 });
}

export async function DELETE(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  // Require CSRF when using cookie-based auth
  if (!request.headers.get('authorization')) {
    const ok = await validateCsrf(request);
    if (!ok) return NextResponse.json({ error: 'CSRF validation failed' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const customerId = searchParams.get('customerId') || auth.id;
  const notificationId = searchParams.get('id');

  if (!notificationId) {
    return NextResponse.json({ error: 'Notification ID required' }, { status: 400 });
  }

  const success = deleteNotification(customerId, notificationId);
  return NextResponse.json({ success });
}
