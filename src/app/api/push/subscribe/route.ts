import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST /api/push/subscribe - Save push subscription
export async function POST(request: Request) {
  try {
    const subscription = await request.json();
    const customerId = request.headers.get('x-customer-id') || request.headers.get('x-user-id') || request.headers.get('x-shop-id');

    if (!customerId) {
      return NextResponse.json({ error: 'Customer or user ID required' }, { status: 400 });
    }

    // Save subscription to database
    await prisma.pushSubscription.upsert({
      where: { customerId },
      update: {
        subscription: JSON.stringify(subscription),
        updatedAt: new Date(),
      },
      create: {
        customerId,
        subscription: JSON.stringify(subscription),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving push subscription:', error);
    return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 });
  }
}
