import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import stripe from '@/lib/stripe';
import { authenticateRequest } from '@/lib/middleware';

// GET /api/customers/payment-methods - Get all payment methods for a customer
export async function GET(request: NextRequest) {
  try {
    const user = authenticateRequest(request);
    if (!user || user.role !== 'customer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Always return a plain array so the dashboard can call Array.isArray() on it.

    // If Stripe is not configured, serve from the local PaymentMethod table.
    if (!process.env.STRIPE_SECRET_KEY) {
      const methods = await prisma.paymentMethod.findMany({
        where: { customerId: user.id },
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
        select: { id: true, type: true, last4: true, brand: true, expiryMonth: true, expiryYear: true, isDefault: true, createdAt: true },
      });
      return NextResponse.json(methods);
    }

    // Get customer's Stripe customer ID
    const customer = await prisma.customer.findUnique({
      where: { id: user.id },
    });

    if (!customer?.stripeCustomerId) {
      // Fall back to local table (e.g. manually added records)
      const methods = await prisma.paymentMethod.findMany({
        where: { customerId: user.id },
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
        select: { id: true, type: true, last4: true, brand: true, expiryMonth: true, expiryYear: true, isDefault: true, createdAt: true },
      });
      return NextResponse.json(methods);
    }

    // Fetch from Stripe and return as a plain array
    const stripeResult = await stripe.paymentMethods.list({
      customer: customer.stripeCustomerId,
      type: 'card',
    });

    return NextResponse.json(stripeResult.data);
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    return NextResponse.json({ error: 'Failed to fetch payment methods' }, { status: 500 });
  }
}

// POST /api/customers/payment-methods - Add a new payment method
export async function POST(request: NextRequest) {
  try {
    const user = authenticateRequest(request);
    if (!user || user.role !== 'customer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { paymentMethodId } = body;

    if (!paymentMethodId) {
      return NextResponse.json(
        { error: 'Payment method ID required' },
        { status: 400 }
      );
    }

    // Get or create stripe customer
    const customer = await prisma.customer.findUnique({
      where: { id: user.id },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    let stripeCustomerId = customer.stripeCustomerId;

    // Create stripe customer if doesn't exist
    if (!stripeCustomerId) {
      const stripeCustomer = await stripe.customers.create({
        email: customer.email || '',
        name: customer.username || `${customer.firstName} ${customer.lastName}`,
      });
      stripeCustomerId = stripeCustomer.id;

      await prisma.customer.update({
        where: { id: customer.id },
        data: { stripeCustomerId },
      });
    }

    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: stripeCustomerId,
    });

    // Set as default if it's the first one
    const existingMethods = await stripe.paymentMethods.list({
      customer: stripeCustomerId,
      type: 'card',
    });

    if (existingMethods.data.length === 1) {
      await stripe.customers.update(stripeCustomerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
    }

    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    return NextResponse.json(paymentMethod, { status: 201 });
  } catch (error) {
    console.error('Error adding payment method:', error);
    return NextResponse.json({ error: 'Failed to add payment method' }, { status: 500 });
  }
}
