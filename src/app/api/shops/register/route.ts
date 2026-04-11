import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

export async function POST(request: Request) {
  try {

    const body = await request.json();
    
    const schema = z.object({
      shopName: z.string().min(2),
      ownerName: z.string().optional(),
      email: z.string().email(),
      phone: z.string().optional(),
      shopType: z.string().optional(),
      serviceLocation: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zipCode: z.string().optional(),
      dieselServices: z.array(z.string()).optional(),
      gasServices: z.array(z.string()).optional(),
      smallEngineServices: z.array(z.string()).optional(),
      heavyEquipmentServices: z.array(z.string()).optional(),
      resurfacingServices: z.array(z.string()).optional(),
      weldingServices: z.array(z.string()).optional(),
      tireServices: z.array(z.string()).optional(),
      mobileServiceRadius: z.number().optional(),
      emergencyService24_7: z.boolean().optional(),
      acceptedPaymentMethods: z.array(z.string()).optional(),
      subscriptionPlan: z.enum(['starter', 'growth', 'professional', 'business', 'enterprise']),
      couponCode: z.string().optional(),
    });
    const data = schema.parse(body);

    // Generate a temporary unique username for pending shops
    const tempUsername = `pending_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // Create shop in database with pending status
    const newShop = await prisma.shop.create({
      data: {
        shopName: data.shopName,
        email: data.email,
        phone: data.phone || '',
        ownerName: data.ownerName || '',
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        zipCode: data.zipCode || '',
        status: 'pending',
        profileComplete: false,
        username: tempUsername, // Temporary username until approved
        password: '', // Will be set during approval
      }
    });
    

    // Create Stripe Checkout Session so the shop owner completes payment on Stripe's hosted page
    let checkoutUrl: string | null = null;
    try {

      const { default: stripeClient, STRIPE_PRODUCTS, createOrRetrieveCustomer } = await import('@/lib/stripe');
      const selectedProduct = STRIPE_PRODUCTS[data.subscriptionPlan];

      // Pre-create (or retrieve) the Stripe customer so the email is pre-filled
      const stripeCustomer = await createOrRetrieveCustomer(data.email, data.ownerName || data.shopName);

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://fixtray.app';

      const session = await stripeClient.checkout.sessions.create({
        mode: 'subscription',
        customer: stripeCustomer.id,
        payment_method_types: ['card'],
        line_items: [
          {
            price: selectedProduct.priceId,
            quantity: 1,
          },
        ],
        subscription_data: {
          trial_period_days: 7, // 7-day free trial � card collected now, charged after trial
          metadata: {
            shopId: newShop.id,
            plan: data.subscriptionPlan,
          },
        },
        allow_promotion_codes: true,
        billing_address_collection: 'required',
        metadata: {
          shopId: newShop.id,
          plan: data.subscriptionPlan,
          couponCode: data.couponCode || '',
          registrationFlow: 'true',
        },
        success_url: `${appUrl}/register/success?session_id={CHECKOUT_SESSION_ID}&shopId=${newShop.id}`,
        cancel_url: `${appUrl}/register/canceled?shopId=${newShop.id}`,
      });

      checkoutUrl = session.url;
    } catch (stripeError) {
      console.error('?? [REGISTER] Stripe Checkout Session creation failed:', stripeError);
      // Registration record was saved � admin can still manually activate the shop.
    }

    return NextResponse.json({
      success: true,
      shopId: newShop.id,
      checkoutUrl,
      message: checkoutUrl
        ? 'Shop registration submitted. Complete checkout to activate your 7-day free trial.'
        : 'Shop registration submitted. Awaiting admin approval.',
    });
  } catch (error) {
    console.error('[REGISTER] ERROR:', error);
    const details = process.env.NODE_ENV === 'development' ? String(error) : undefined;
    return NextResponse.json({ error: 'Registration failed', ...(details && { details }) }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const auth = requireRole(request, ['admin', 'superadmin']);
  if (auth instanceof NextResponse) return auth;

  try {
    const allShops = await prisma.shop.findMany({
      where: {
        status: 'pending'
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    return NextResponse.json(allShops);
  } catch (error) {
    console.error('Error fetching shops:', error);
    return NextResponse.json({ error: 'Failed to fetch shops' }, { status: 500 });
  }
}
