import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import prisma from '@/lib/prisma';
import { cancelSubscription } from '@/lib/stripe';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ shopId: string }> }) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  // Allow shop owner, admin, or superadmin to cancel
  const { shopId: paramShopId } = await params;
  const isShopOwner = auth.role === 'shop' && auth.id === paramShopId;
  const isAdmin = auth.role === 'admin' || auth.role === 'superadmin';
  if (!isShopOwner && !isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const shopId = paramShopId;
    const { reason, immediate = false } = await request.json();

    // Get current subscription
    const subscription = await prisma.subscription.findUnique({
      where: { shopId }
    });

    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    if (!subscription.stripeSubscriptionId) {
      return NextResponse.json({ error: 'No active Stripe subscription found' }, { status: 400 });
    }

    // 1. Cancel the subscription in Stripe
    await cancelSubscription(subscription.stripeSubscriptionId, !immediate);

    // 2. Update subscription in our database
    const updatedSubscription = await prisma.subscription.update({
      where: { shopId },
      data: {
        cancelAtPeriodEnd: !immediate,
        status: immediate ? 'cancelled' : 'active',
        updatedAt: new Date(),
        canceledAt: immediate ? new Date() : null,
      },
    });

    // 3. If immediate cancellation, update shop status
    if (immediate) {
      await prisma.shop.update({
        where: { id: shopId },
        data: {
          status: 'suspended',
        },
      });
    }

    // 4. Notify super admin (placeholder destination)
    try {
      console.log('[SUBSCRIPTION] Notify super admin: cancellation requested', { shopId, reason, immediate });
    } catch (notifyError) {
      console.error('Failed to notify super admin about cancellation', notifyError);
    }

    return NextResponse.json({
      success: true,
      message: `Subscription ${immediate ? 'immediately cancelled' : 'scheduled for cancellation'}`,
      subscription: {
        id: updatedSubscription.id,
        shopId: updatedSubscription.shopId,
        status: updatedSubscription.status,
        cancelAtPeriodEnd: updatedSubscription.cancelAtPeriodEnd,
        cancelledAt: new Date().toISOString(),
        effectiveDate: immediate ? new Date().toISOString() :
          updatedSubscription.currentPeriodEnd?.toISOString(),
      }
    });

  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 });
  }
}