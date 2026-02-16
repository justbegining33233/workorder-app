import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import prisma from '@/lib/prisma';
import { updateSubscription, STRIPE_PRODUCTS } from '@/lib/stripe';
import type { StripePlan } from '@/lib/stripe';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ shopId: string }> }) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  // Only admins can update subscription plans
  if (auth.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { plan, billingCycle } = await request.json();
    const { shopId } = await params;

    // Validate plan - map to our new plan names
    const planMapping: Record<string, StripePlan> = {
      'Trial': 'starter',
      'Business': 'business',
      'Professional': 'professional',
      'Enterprise': 'enterprise'
    };

    const mappedPlan = planMapping[plan] || plan.toLowerCase() as StripePlan;
    const validPlans = Object.keys(STRIPE_PRODUCTS);
    if (!validPlans.includes(mappedPlan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    // Validate billing cycle
    if (!['monthly', 'yearly'].includes(billingCycle)) {
      return NextResponse.json({ error: 'Invalid billing cycle' }, { status: 400 });
    }

    // Get current subscription
    const currentSubscription = await prisma.subscription.findUnique({
      where: { shopId },
    });

    if (!currentSubscription?.stripeSubscriptionId) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 400 });
    }

    // Update subscription in Stripe
    const newPriceId = STRIPE_PRODUCTS[mappedPlan].priceId;
    await updateSubscription(currentSubscription.stripeSubscriptionId, newPriceId);

    // Update subscription in our database
    const updatedSubscription = await prisma.subscription.update({
      where: { shopId },
      data: {
        plan: mappedPlan,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Subscription updated to ${mappedPlan} (${billingCycle})`,
      subscription: {
        id: updatedSubscription.id,
        shopId: updatedSubscription.shopId,
        plan: updatedSubscription.plan,
        status: updatedSubscription.status,
        maxUsers: updatedSubscription.maxUsers,
        maxShops: updatedSubscription.maxShops,
      }
    });

  } catch (error) {
    console.error('Error updating subscription:', error);
    return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
  }
}