import { NextRequest, NextResponse } from 'next/server';
import stripe from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
  } catch (err) {
    console.error('🔴 [WEBHOOK] Signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  console.log(`🔵 [WEBHOOK] Received event: ${event.type}`);

  try {
    switch (event.type) {
      // Subscription created
      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`✅ [WEBHOOK] Subscription created: ${subscription.id}`);
        
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            status: subscription.status === 'active' ? 'active' : 'trialing',
            // currentPeriodStart: new Date(subscription.current_period_start * 1000),
            // currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          },
        });
        break;
      }

      // Subscription updated (upgrade, downgrade, renewal)
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`🔄 [WEBHOOK] Subscription updated: ${subscription.id}, status: ${subscription.status}`);
        
        let status: 'active' | 'past_due' | 'canceled' | 'trialing' | 'paused' = 'active';
        if (subscription.status === 'trialing') status = 'trialing';
        else if (subscription.status === 'past_due') status = 'past_due';
        else if (subscription.status === 'canceled') status = 'canceled';
        else if (subscription.status === 'paused') status = 'paused';

        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            status,
            // currentPeriodStart: new Date(subscription.current_period_start * 1000),
            // currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            // cancelAtPeriodEnd: subscription.cancel_at_period_end,
          },
        });
        break;
      }

      // Subscription canceled
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`❌ [WEBHOOK] Subscription canceled: ${subscription.id}`);
        
        const updated = await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            status: 'canceled',
            canceledAt: new Date(),
            cancelAtPeriodEnd: true,
          },
        });

        if (updated.count > 0) {
          // Soft-close shop access when the subscription actually ends
          await prisma.shop.updateMany({
            where: { subscription: { stripeSubscriptionId: subscription.id } },
            data: { status: 'suspended' },
          });

          // Placeholder: notify super admin about cancellation completion
          console.log('[WEBHOOK] Notify super admin: subscription ended and shop suspended', { stripeSubscriptionId: subscription.id });
        }
        break;
      }

      // Payment successful
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`💰 [WEBHOOK] Payment succeeded for invoice: ${invoice.id}`);
        
        // if (invoice.subscription) {
          await prisma.subscription.updateMany({
            where: { stripeSubscriptionId: 'unknown' }, // invoice.subscription as string
            data: {
              status: 'active',
              lastPaymentDate: new Date(),
              lastPaymentAmount: (invoice.amount_paid / 100),
            },
          });

          // Log payment in history
          await prisma.paymentHistory.create({
            data: {
              stripeInvoiceId: invoice.id,
              stripeSubscriptionId: 'unknown', // invoice.subscription as string
              amount: invoice.amount_paid / 100,
              currency: invoice.currency,
              status: 'succeeded',
              paidAt: new Date(),
            },
          }).catch((err) => {
            console.log('PaymentHistory creation failed:', err);
          });
        // }
        break;
      }

      // Payment failed
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`🔴 [WEBHOOK] Payment failed for invoice: ${invoice.id}`);
        
        // if (invoice.subscription) {
          await prisma.subscription.updateMany({
            where: { stripeSubscriptionId: 'unknown' }, // invoice.subscription as string
            data: {
              status: 'past_due',
            },
          });
        // }
        break;
      }

      // Trial ending soon (3 days before)
      case 'customer.subscription.trial_will_end': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`⚠️ [WEBHOOK] Trial ending soon for: ${subscription.id}`);
        // TODO: Send email notification to customer
        break;
      }

      default:
        console.log(`ℹ️ [WEBHOOK] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('🔴 [WEBHOOK] Error processing event:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
