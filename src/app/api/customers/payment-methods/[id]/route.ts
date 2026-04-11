import { NextRequest, NextResponse } from 'next/server';
import stripe from '@/lib/stripe';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import type { AuthUser } from '@/lib/auth';

// DELETE /api/customers/payment-methods/[id] - Detach a payment method
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireRole(request, ['customer']);
  if (auth instanceof NextResponse) return auth;
  const user = auth as AuthUser;

  try {
    const { id } = await params;

    // Verify the payment method belongs to the authenticated customer
    const customer = await prisma.customer.findUnique({
      where: { id: user.id },
      select: { stripeCustomerId: true },
    });
    if (!customer?.stripeCustomerId) {
      return NextResponse.json({ error: 'No Stripe account found' }, { status: 400 });
    }

    const paymentMethod = await stripe.paymentMethods.retrieve(id);
    if (paymentMethod.customer !== customer.stripeCustomerId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await stripe.paymentMethods.detach(id);

    return NextResponse.json({ message: 'Payment method removed successfully' });
  } catch (error) {
    console.error('Error removing payment method:', error);
    return NextResponse.json({ error: 'Failed to remove payment method' }, { status: 500 });
  }
}

// PATCH /api/customers/payment-methods/[id] - Set as default
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireRole(request, ['customer']);
  if (auth instanceof NextResponse) return auth;
  const user = auth as AuthUser;

  try {
    const { id } = await params;

    // Resolve the authenticated customer's Stripe ID — never trust body.customerId
    const customer = await prisma.customer.findUnique({
      where: { id: user.id },
      select: { stripeCustomerId: true },
    });
    if (!customer?.stripeCustomerId) {
      return NextResponse.json({ error: 'No Stripe account found' }, { status: 400 });
    }

    // Verify the payment method belongs to this customer
    const paymentMethod = await stripe.paymentMethods.retrieve(id);
    if (paymentMethod.customer !== customer.stripeCustomerId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Set as default
    await stripe.customers.update(customer.stripeCustomerId, {
      invoice_settings: { default_payment_method: id },
    });

    return NextResponse.json({ message: 'Set as default payment method' });
  } catch (error) {
    console.error('Error setting default payment method:', error);
    return NextResponse.json({ error: 'Failed to set default' }, { status: 500 });
  }
}
