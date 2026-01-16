import { NextResponse } from 'next/server';
import stripe from '@/lib/stripe';

// DELETE /api/customers/payment-methods/[id] - Detach a payment method
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await stripe.paymentMethods.detach(id);

    return NextResponse.json({ message: 'Payment method removed successfully' });
  } catch (error) {
    console.error('Error removing payment method:', error);
    return NextResponse.json({ error: 'Failed to remove payment method' }, { status: 500 });
  }
}

// PATCH /api/customers/payment-methods/[id] - Set as default
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { customerId } = body;

    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID required' }, { status: 400 });
    }

    // Get payment method to find stripe customer
    const paymentMethod = await stripe.paymentMethods.retrieve(id);
    
    if (!paymentMethod.customer) {
      return NextResponse.json({ error: 'Payment method not attached to customer' }, { status: 400 });
    }

    // Set as default
    await stripe.customers.update(paymentMethod.customer as string, {
      invoice_settings: {
        default_payment_method: id,
      },
    });

    return NextResponse.json({ message: 'Set as default payment method' });
  } catch (error) {
    console.error('Error setting default payment method:', error);
    return NextResponse.json({ error: 'Failed to set default' }, { status: 500 });
  }
}
