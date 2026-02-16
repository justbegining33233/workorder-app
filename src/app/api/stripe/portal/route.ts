import { NextRequest, NextResponse } from 'next/server';
import stripe from '@/lib/stripe';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/middleware';

// Create customer portal session (for managing billing, updating payment methods)
export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'Stripe is not configured (missing STRIPE_SECRET_KEY).' }, { status: 500 });
    }

    const body = await request.json();
    const shopId = body?.shopId || auth.shopId;

    if (!shopId) {
      return NextResponse.json({ error: 'Shop ID is required' }, { status: 400 });
    }

    const isShopOwner = auth.role === 'shop' && auth.id === shopId;
    const isAdmin = auth.role === 'admin' || auth.role === 'superadmin';
    if (!isShopOwner && !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const shop = await prisma.shop.findUnique({ where: { id: shopId }, include: { subscription: true } });
    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    let stripeCustomerId = shop.subscription?.stripeCustomerId;

    // If missing, create Stripe customer and persist
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: shop.email || undefined,
        name: shop.shopName || undefined,
        metadata: { shopId },
      });
      stripeCustomerId = customer.id;

      await prisma.subscription.upsert({
        where: { shopId },
        update: { stripeCustomerId, updatedAt: new Date() },
        create: {
          shopId,
          plan: 'starter',
          status: 'active',
          stripeCustomerId,
          maxUsers: 1,
          maxShops: 1,
        },
      });
    }

    const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000'}/shop/settings`;

    // Create billing portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: returnUrl,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = (error as any)?.message || 'Failed to create portal session';
    console.error('🔴 [PORTAL] Error creating session:', message, error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
