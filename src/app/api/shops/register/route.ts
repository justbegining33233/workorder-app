import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { createSubscription } from '@/lib/stripe';
import { SUBSCRIPTION_PLANS } from '@/lib/subscription';

export async function POST(request: Request) {
  try {
    console.log('🔵 [REGISTER] Registration request received');
    const req = request as any;
    // Validate public CSRF token (double-submit)
    // const { validatePublicCsrf } = await import('@/lib/csrf');
    // const ok = validatePublicCsrf(req);
    // if (!ok) {
    //   console.log('🔴 [REGISTER] CSRF validation FAILED');
    //   return NextResponse.json({ error: 'CSRF validation failed' }, { status: 403 });
    // }
    // console.log('✅ [REGISTER] CSRF validation passed');
    
    const body = await request.json();
    console.log('🔵 [REGISTER] Request body:', JSON.stringify(body, null, 2));
    
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
    console.log('✅ [REGISTER] Validation passed');

    // Generate a temporary unique username for pending shops
    const tempUsername = `pending_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    console.log('🔵 [REGISTER] Creating shop with username:', tempUsername);
    
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
    
    console.log('✅ [REGISTER] Shop created successfully! ID:', newShop.id);

    // Create Stripe customer and subscription with trial
    try {
      console.log('🔵 [REGISTER] Creating Stripe customer and subscription...');
      
      const planDetails = SUBSCRIPTION_PLANS[data.subscriptionPlan];
      const stripeProduct = await import('@/lib/stripe').then(m => m.STRIPE_PRODUCTS[data.subscriptionPlan]);
      
      // Create Stripe customer
      const stripeCustomer = await import('@/lib/stripe').then(m => m.createOrRetrieveCustomer(data.email, data.ownerName || data.shopName));
      
      // Calculate trial end date (7 days from now)
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 7);
      
      // Create subscription with trial period
      const subscription = await import('@/lib/stripe').then(m => m.default.subscriptions.create({
        customer: stripeCustomer.id,
        items: [{ price: stripeProduct.priceId }],
        trial_end: Math.floor(trialEndDate.getTime() / 1000), // Unix timestamp
        discounts: data.couponCode ? [{ coupon: data.couponCode }] : undefined, // Apply coupon if provided
        metadata: {
          shopId: newShop.id,
          plan: data.subscriptionPlan,
          couponCode: data.couponCode || '',
        },
      }));
      
      // Create subscription record in database
      await prisma.subscription.create({
        data: {
          shopId: newShop.id,
          plan: data.subscriptionPlan,
          status: 'trialing',
          stripeSubscriptionId: subscription.id,
          stripeCustomerId: stripeCustomer.id,
          currentPeriodStart: new Date(),
          currentPeriodEnd: trialEndDate,
          maxUsers: planDetails.maxUsers,
          maxShops: planDetails.maxShops,
        }
      });
      
      console.log('✅ [REGISTER] Subscription created with 7-day trial');
    } catch (stripeError) {
      console.error('🔴 [REGISTER] Stripe subscription creation failed:', stripeError);
      // Don't fail registration if Stripe fails, but log it
      // In production, you might want to handle this differently
    }
    
    return NextResponse.json({ 
      success: true, 
      shopId: newShop.id,
      message: 'Shop registration submitted. Awaiting admin approval. Your 7-day free trial has started!'
    });
  } catch (error) {
    console.error('🔴 [REGISTER] ERROR:', error);
    return NextResponse.json({ error: 'Registration failed', details: error }, { status: 500 });
  }
}

export async function GET() {
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
