import { NextRequest, NextResponse } from 'next/server';
import stripe from '@/lib/stripe';
import prisma from '@/lib/prisma';
import Stripe from 'stripe';
import { sendPaymentReceiptEmail } from '@/lib/emailService';
import { pushPaymentConfirmed } from '@/lib/serverPush';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET is not set');
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );
  } catch (err) {
    console.error('[WEBHOOK] Signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }


  try {
    switch (event.type) {
      // Subscription created
      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        
        const sub0 = subscription as any;
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            status: subscription.status === 'active' ? 'active' : 'trialing',
            currentPeriodStart: sub0.current_period_start ? new Date(sub0.current_period_start * 1000) : undefined,
            currentPeriodEnd: sub0.current_period_end ? new Date(sub0.current_period_end * 1000) : undefined,
          },
        });
        break;
      }

      // Subscription updated (upgrade, downgrade, renewal)
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const subU = subscription as any;
        
        let status: 'active' | 'past_due' | 'canceled' | 'trialing' | 'paused' = 'active';
        if (subscription.status === 'trialing') status = 'trialing';
        else if (subscription.status === 'past_due') status = 'past_due';
        else if (subscription.status === 'canceled') status = 'canceled';
        else if (subscription.status === 'paused') status = 'paused';

        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            status,
            currentPeriodStart: subU.current_period_start ? new Date(subU.current_period_start * 1000) : undefined,
            currentPeriodEnd: subU.current_period_end ? new Date(subU.current_period_end * 1000) : undefined,
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
          },
        });
        break;
      }

      // Subscription canceled
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
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
        }
        break;
      }

      // Payment successful
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        
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
          });
        // }
        break;
      }

      // Payment failed
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        
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
        // TODO: Send email notification to customer
        break;
      }

      // Checkout completed — handles both work-order payments and new shop registrations
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const { workOrderId, shopId, plan, registrationFlow } = session.metadata ?? {};

        // ── Registration flow: shop owner completed Stripe Checkout ──────────
        if (registrationFlow === 'true' && shopId && plan) {

          // Retrieve the subscription Stripe just created so we have real IDs
          const stripeSubscriptionId = typeof session.subscription === 'string'
            ? session.subscription
            : session.subscription?.id ?? null;

          const { SUBSCRIPTION_PLANS } = await import('@/lib/subscription');
          const planDetails = (SUBSCRIPTION_PLANS as any)[plan];
          const trialEndDate = new Date();
          trialEndDate.setDate(trialEndDate.getDate() + 7);

          // Upsert the subscription record (avoid duplicates on retried webhooks)
          const existing = await prisma.subscription.findFirst({ where: { shopId } });
          if (existing) {
            await prisma.subscription.update({
              where: { id: existing.id },
              data: {
                plan,
                status: 'trialing',
                stripeSubscriptionId: stripeSubscriptionId ?? existing.stripeSubscriptionId,
                stripeCustomerId: typeof session.customer === 'string' ? session.customer : existing.stripeCustomerId,
                currentPeriodStart: new Date(),
                currentPeriodEnd: trialEndDate,
                maxUsers: planDetails?.maxUsers ?? 1,
                maxShops: planDetails?.maxShops ?? 1,
              },
            });
          } else {
            await prisma.subscription.create({
              data: {
                shopId,
                plan,
                status: 'trialing',
                stripeSubscriptionId: stripeSubscriptionId ?? '',
                stripeCustomerId: typeof session.customer === 'string' ? session.customer : '',
                currentPeriodStart: new Date(),
                currentPeriodEnd: trialEndDate,
                maxUsers: planDetails?.maxUsers ?? 1,
                maxShops: planDetails?.maxShops ?? 1,
              },
            });
          }

          break;
        }

        // ── Work-order payment flow ───────────────────────────────────────────
        if (!workOrderId) break;


        const updatedWO = await prisma.workOrder.update({
          where: { id: workOrderId },
          data: {
            paymentStatus: 'paid',
            status: 'closed',
            amountPaid: (session.amount_total ?? 0) / 100,
          },
          include: {
            customer: { select: { email: true, firstName: true, lastName: true } },
            shop: { select: { shopName: true } },
          },
        });

        // Send payment receipt email
        if (updatedWO.customer?.email) {
          sendPaymentReceiptEmail(
            updatedWO.customer.email,
            `${updatedWO.customer.firstName} ${updatedWO.customer.lastName}`,
            workOrderId,
            (session.amount_total ?? 0) / 100,
            updatedWO.shop?.shopName || 'Your Shop',
            updatedWO.issueDescription || 'Vehicle Service'
          ).catch(console.error);
        }

        // Send push notification
        if (updatedWO.customerId) {
          pushPaymentConfirmed(updatedWO.customerId, (session.amount_total ?? 0) / 100, workOrderId).catch(console.error);
        }
        break;
      }

      default:
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('🔴 [WEBHOOK] Error processing event:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
