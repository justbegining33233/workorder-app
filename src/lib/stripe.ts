import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

export default stripe;

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

export async function refundPayment(paymentIntentId: string, amount?: number) {
  const refundData: any = { payment_intent: paymentIntentId };
  if (amount) refundData.amount = Math.round(amount * 100);
  return stripe.refunds.create(refundData);
}
