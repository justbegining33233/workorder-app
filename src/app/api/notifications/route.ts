import { NextRequest, NextResponse } from 'next/server';
import { getNotifications, markAsRead, markAllAsRead, deleteNotification } from '@/lib/notifications';
import { requireAuth } from '@/lib/middleware';
import { validateCsrf } from '@/lib/csrf';

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  // Only customers have notifications stored in the DB
  if (auth.role !== 'customer') return NextResponse.json([]);

  const customerId = auth.id;
  const notifs = await getNotifications(customerId);
  return NextResponse.json(notifs);
}

export async function PATCH(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  if (auth.role !== 'customer') return NextResponse.json({ success: false }, { status: 403 });

  // Require CSRF when using cookie-based auth
  if (!request.headers.get('authorization')) {
    const ok = await validateCsrf(request);
    if (!ok) return NextResponse.json({ error: 'CSRF validation failed' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  // Always scope to the authenticated user — never trust a caller-supplied customerId
  const customerId = auth.id;
  const notificationId = searchParams.get('id');
  const action = searchParams.get('action');

  if (action === 'markAllRead') {
    await markAllAsRead(customerId);
    return NextResponse.json({ success: true });
  }

  if (notificationId) {
    const success = await markAsRead(customerId, notificationId);
    return NextResponse.json({ success });
  }

  return NextResponse.json({ success: false }, { status: 400 });
}

export async function DELETE(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  if (auth.role !== 'customer') return NextResponse.json({ success: false }, { status: 403 });

  // Require CSRF when using cookie-based auth
  if (!request.headers.get('authorization')) {
    const ok = await validateCsrf(request);
    if (!ok) return NextResponse.json({ error: 'CSRF validation failed' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  // Always scope to the authenticated user — never trust a caller-supplied customerId
  const customerId = auth.id;
  const notificationId = searchParams.get('id');

  if (!notificationId) {
    return NextResponse.json({ error: 'Notification ID required' }, { status: 400 });
  }

  const success = await deleteNotification(customerId, notificationId);
  return NextResponse.json({ success });
}
