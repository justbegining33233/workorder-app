import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import type { AuthUser } from '@/lib/auth';

// POST /api/push/unsubscribe - Remove push subscription
export async function POST(request: NextRequest) {
  const auth = requireRole(request, ['customer', 'shop', 'tech', 'manager', 'admin']);
  if (auth instanceof NextResponse) return auth;
  const user = auth as AuthUser;

  try {
    const body = await request.json().catch(() => null);
    const endpoint = body?.endpoint;

    if (!endpoint) {
      return NextResponse.json({ error: 'Endpoint required' }, { status: 400 });
    }

    // Only delete the subscription belonging to the authenticated user that
    // matches the supplied endpoint — prevents one user unsubscribing another
    await prisma.pushSubscription.deleteMany({
      where: {
        customerId: user.id,
        subscription: { contains: endpoint },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing push subscription:', error);
    return NextResponse.json({ error: 'Failed to remove subscription' }, { status: 500 });
  }
}
