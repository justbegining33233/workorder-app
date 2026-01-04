import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import prisma from '@/lib/prisma';
import stripe from '@/lib/stripe';
import { sendPaymentConfirmationEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    // Additional security: Check for custom webhook secret header
    const webhookSecret = request.headers.get('x-webhook-secret');
    if (process.env.CUSTOM_WEBHOOK_SECRET && webhookSecret !== process.env.CUSTOM_WEBHOOK_SECRET) {
      console.error('Invalid custom webhook secret');
      return NextResponse.json({ error: 'Invalid webhook secret' }, { status: 401 });
    }

    const sig = request.headers.get('stripe-signature');
    if (!sig) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }
    
    const body = await request.text();
    const event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
    
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const workOrderId = paymentIntent.metadata.workOrderId;
      
      // Update work order
      const workOrder = await prisma.workOrder.update({
        where: { id: workOrderId },
        data: {
          status: 'closed',
          paymentStatus: 'paid',
          amountPaid: paymentIntent.amount / 100,
          completedAt: new Date(),
        },
        include: { customer: true },
      });
      
      // Send confirmation email
      sendPaymentConfirmationEmail(
        workOrder.customer.email,
        workOrder.id,
        workOrder.amountPaid!
      ).catch(console.error);
      
      // Create notification
      await prisma.notification.create({
        data: {
          customerId: workOrder.customerId,
          type: 'payment',
          title: 'Payment Successful',
          message: `Payment of $${workOrder.amountPaid!.toFixed(2)} received for work order ${workOrder.id}`,
          workOrderId: workOrder.id,
        },
      });
    }
    
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 });
  }
}
