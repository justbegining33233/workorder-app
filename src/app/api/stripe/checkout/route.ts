import { NextRequest, NextResponse } from 'next/server';
import stripe from '@/lib/stripe';
import { STRIPE_PRODUCTS, StripePlan } from '@/lib/stripe';
import { verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { plan, shopId, email, shopName } = body;

    // Validate plan
    if (!plan || !STRIPE_PRODUCTS[plan as StripePlan]) {
      return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 });
    }

    const selectedPlan = STRIPE_PRODUCTS[plan as StripePlan];

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: selectedPlan.priceId,
          quantity: 1,
        },
      ],
      customer_email: email,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/shop/settings?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/shop/settings?payment=canceled`,
      metadata: {
        shopId,
        plan,
        userId: decoded.userId,
      },
      subscription_data: {
        trial_period_days: 14, // 14-day free trial
        metadata: {
          shopId,
          plan,
        },
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('🔴 [CHECKOUT] Error creating session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
