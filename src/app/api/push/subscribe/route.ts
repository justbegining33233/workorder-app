import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import type { AuthUser } from '@/lib/auth';

// POST /api/push/subscribe - Save push subscription
export async function POST(request: NextRequest) {
  const auth = requireRole(request, ['customer', 'shop', 'tech', 'manager', 'admin']);
  if (auth instanceof NextResponse) return auth;
  const user = auth as AuthUser;

  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    // Save subscription to database keyed to the authenticated user's ID
    await prisma.pushSubscription.upsert({
      where: { customerId: user.id },
      update: {
        subscription: JSON.stringify(body),
        updatedAt: new Date(),
      },
      create: {
        customerId: user.id,
        subscription: JSON.stringify(body),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving push subscription:', error);
    return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 });
  }
}
