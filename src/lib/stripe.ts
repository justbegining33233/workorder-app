import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-12-15.clover',
});

export default stripe;

// Stripe Product and Price IDs for each plan
// These would be created in your Stripe dashboard
export const STRIPE_PRODUCTS = {
  starter: {
    productId: process.env.STRIPE_STARTER_PRODUCT_ID || 'prod_starter_placeholder',
    priceId: process.env.STRIPE_STARTER_PRICE_ID || 'price_starter_placeholder',
    name: 'Starter',
    price: 99,
    interval: 'month',
    maxUsers: 1,
    maxShops: 1,
  },
  growth: {
    productId: process.env.STRIPE_GROWTH_PRODUCT_ID || 'prod_growth_placeholder',
    priceId: process.env.STRIPE_GROWTH_PRICE_ID || 'price_growth_placeholder',
    name: 'Growth',
    price: 199,
    interval: 'month',
    maxUsers: 5,
    maxShops: 1,
  },
  professional: {
    productId: process.env.STRIPE_PROFESSIONAL_PRODUCT_ID || 'prod_professional_placeholder',
    priceId: process.env.STRIPE_PROFESSIONAL_PRICE_ID || 'price_professional_placeholder',
    name: 'Professional',
    price: 349,
    interval: 'month',
    maxUsers: 15,
    maxShops: 1,
  },
  business: {
    productId: process.env.STRIPE_BUSINESS_PRODUCT_ID || 'prod_business_placeholder',
    priceId: process.env.STRIPE_BUSINESS_PRICE_ID || 'price_business_placeholder',
    name: 'Business',
    price: 599,
    interval: 'month',
    maxUsers: 40,
    maxShops: 5,
  },
  enterprise: {
    productId: process.env.STRIPE_ENTERPRISE_PRODUCT_ID || 'prod_enterprise_placeholder',
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise_placeholder',
    name: 'Enterprise',
    price: 999,
    interval: 'month',
    maxUsers: -1, // unlimited
    maxShops: -1, // unlimited
  },
} as const;

export type StripePlan = keyof typeof STRIPE_PRODUCTS;

export async function createPaymentIntent(amount: number, metadata: Record<string, string>) {
  return stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Convert to cents
    currency: 'usd',
    metadata,
    automatic_payment_methods: {
      enabled: true,
    },
  });
}

export async function createCustomer(email: string, name: string) {
  return stripe.customers.create({
    email,
    name,
  });
}

export async function attachPaymentMethod(paymentMethodId: string, customerId: string) {
  return stripe.paymentMethods.attach(paymentMethodId, {
    customer: customerId,
  });
}

export async function detachPaymentMethod(paymentMethodId: string) {
  return stripe.paymentMethods.detach(paymentMethodId);
}

export async function listPaymentMethods(customerId: string) {
  return stripe.paymentMethods.list({
    customer: customerId,
    type: 'card',
  });
}

export async function setDefaultPaymentMethod(customerId: string, paymentMethodId: string) {
  return stripe.customers.update(customerId, {
    invoice_settings: {
      default_payment_method: paymentMethodId,
    },
  });
}

export async function refundPayment(paymentIntentId: string, amount?: number) {
  const refundData: any = { payment_intent: paymentIntentId };
  if (amount) refundData.amount = Math.round(amount * 100);
  return stripe.refunds.create(refundData);
}

/**
 * Create or retrieve a Stripe customer
 */
export async function createOrRetrieveCustomer(email: string, name?: string) {
  try {
    // Try to find existing customer
    const existingCustomers = await stripe.customers.list({
      email,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      return existingCustomers.data[0];
    }

    // Create new customer
    const customer = await stripe.customers.create({
      email,
      name,
    });

    return customer;
  } catch (error) {
    console.error('Error creating/retrieving Stripe customer:', error);
    throw error;
  }
}

/**
 * Create a subscription
 */
export async function createSubscription(customerId: string, priceId: string, metadata?: Record<string, string>) {
  try {
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      metadata,
      expand: ['latest_invoice.payment_intent'],
    });

    return subscription;
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw error;
  }
}

/**
 * Update a subscription plan
 */
export async function updateSubscription(subscriptionId: string, newPriceId: string) {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    // Update the subscription item with the new price
    const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
      items: [{
        id: subscription.items.data[0].id,
        price: newPriceId,
      }],
      proration_behavior: 'create_prorations',
    });

    return updatedSubscription;
  } catch (error) {
    console.error('Error updating subscription:', error);
    throw error;
  }
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(subscriptionId: string, cancelAtPeriodEnd = true) {
  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: cancelAtPeriodEnd,
    });

    return subscription;
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    throw error;
  }
}

/**
 * Get subscription details
 */
export async function getSubscription(subscriptionId: string) {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    return subscription;
  } catch (error) {
    console.error('Error retrieving subscription:', error);
    throw error;
  }
}

/**
 * Handle Stripe webhooks
 */
export async function handleWebhook(rawBody: string, signature: string) {
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  try {
    const event = stripe.webhooks.constructEvent(rawBody, signature, endpointSecret);

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        // Handle subscription changes
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionChange(subscription);
        break;

      case 'customer.subscription.deleted':
        // Handle subscription cancellation
        const cancelledSubscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCancellation(cancelledSubscription);
        break;

      case 'invoice.payment_succeeded':
        // Handle successful payment
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSuccess(invoice);
        break;

      case 'invoice.payment_failed':
        // Handle failed payment
        const failedInvoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailure(failedInvoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return { received: true };
  } catch (error) {
    console.error('Webhook error:', error);
    throw error;
  }
}

/**
 * Handle subscription changes from webhooks
 */
async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const { prisma } = await import('@/lib/prisma');

  try {
    // Find the plan based on the price ID
    const priceId = subscription.items.data[0].price.id;
    const plan = Object.keys(STRIPE_PRODUCTS).find(
      key => STRIPE_PRODUCTS[key as StripePlan].priceId === priceId
    ) as StripePlan | undefined;

    if (!plan) {
      console.error('Unknown price ID:', priceId);
      return;
    }

    // Update the subscription in our database
    await prisma.subscription.upsert({
      where: { stripeSubscriptionId: subscription.id },
      update: {
        plan,
        status: subscription.status,
        currentPeriodStart: (subscription as any).current_period_start ? new Date((subscription as any).current_period_start * 1000) : null,
        currentPeriodEnd: (subscription as any).current_period_end ? new Date((subscription as any).current_period_end * 1000) : null,
        cancelAtPeriodEnd: (subscription as any).cancel_at_period_end || false,
        maxUsers: STRIPE_PRODUCTS[plan].maxUsers || 1,
        maxShops: STRIPE_PRODUCTS[plan].maxShops || 1,
        updatedAt: new Date(),
      },
      create: {
        shopId: subscription.metadata.shopId || 'unknown',
        plan,
        status: subscription.status,
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: subscription.customer as string,
        currentPeriodStart: (subscription as any).current_period_start ? new Date((subscription as any).current_period_start * 1000) : null,
        currentPeriodEnd: (subscription as any).current_period_end ? new Date((subscription as any).current_period_end * 1000) : null,
        cancelAtPeriodEnd: (subscription as any).cancel_at_period_end || false,
        maxUsers: STRIPE_PRODUCTS[plan].maxUsers || 1,
        maxShops: STRIPE_PRODUCTS[plan].maxShops || 1,
      },
    });
  } catch (error) {
    console.error('Error handling subscription change:', error);
  }
}

/**
 * Handle subscription cancellation
 */
async function handleSubscriptionCancellation(subscription: Stripe.Subscription) {
  const { prisma } = await import('@/lib/prisma');

  try {
    await prisma.subscription.update({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: 'cancelled',
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Error handling subscription cancellation:', error);
  }
}

/**
 * Handle successful payment
 */
async function handlePaymentSuccess(invoice: Stripe.Invoice) {
  // Handle successful payment (e.g., update subscription status, send confirmation)
  console.log('Payment succeeded for invoice:', invoice.id);
}

/**
 * Handle failed payment
 */
async function handlePaymentFailure(invoice: Stripe.Invoice) {
  // Handle failed payment (e.g., suspend subscription, send notification)
  console.log('Payment failed for invoice:', invoice.id);
}

/**
 * Create a coupon
 */
export async function createCoupon(couponData: {
  id: string;
  name: string;
  percentOff?: number;
  amountOff?: number;
  duration: 'forever' | 'once' | 'repeating';
  durationInMonths?: number;
  maxRedemptions?: number;
  redeemBy?: Date;
}) {
  try {
    const coupon = await stripe.coupons.create({
      id: couponData.id,
      name: couponData.name,
      percent_off: couponData.percentOff,
      amount_off: couponData.amountOff ? Math.round(couponData.amountOff * 100) : undefined,
      currency: 'usd',
      duration: couponData.duration,
      duration_in_months: couponData.durationInMonths,
      max_redemptions: couponData.maxRedemptions,
      redeem_by: couponData.redeemBy ? Math.floor(couponData.redeemBy.getTime() / 1000) : undefined,
    });

    return coupon;
  } catch (error) {
    console.error('Error creating coupon:', error);
    throw error;
  }
}

/**
 * Apply coupon to subscription
 */
export async function applyCouponToSubscription(subscriptionId: string, couponId: string) {
  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      discounts: [{ coupon: couponId }],
    });

    return subscription;
  } catch (error) {
    console.error('Error applying coupon to subscription:', error);
    throw error;
  }
}

/**
 * Remove coupon from subscription
 */
export async function removeCouponFromSubscription(subscriptionId: string) {
  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      discounts: [],
    });

    return subscription;
  } catch (error) {
    console.error('Error removing coupon from subscription:', error);
    throw error;
  }
}

/**
 * Get coupon details
 */
export async function getCoupon(couponId: string) {
  try {
    const coupon = await stripe.coupons.retrieve(couponId);
    return coupon;
  } catch (error) {
    console.error('Error retrieving coupon:', error);
    throw error;
  }
}

/**
 * List all coupons
 */
export async function listCoupons() {
  try {
    const coupons = await stripe.coupons.list();
    return coupons;
  } catch (error) {
    console.error('Error listing coupons:', error);
    throw error;
  }
}
