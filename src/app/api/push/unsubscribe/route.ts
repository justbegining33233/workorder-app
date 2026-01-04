import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST /api/push/unsubscribe - Remove push subscription
export async function POST(request: Request) {
  try {
    const subscription = await request.json();
    const endpoint = subscription?.endpoint;

    if (!endpoint) {
      return NextResponse.json({ error: 'Endpoint required' }, { status: 400 });
    }

    // Find and delete subscription by endpoint
    await prisma.pushSubscription.deleteMany({
      where: {
        subscription: {
          contains: endpoint,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing push subscription:', error);
    return NextResponse.json({ error: 'Failed to remove subscription' }, { status: 500 });
  }
}
