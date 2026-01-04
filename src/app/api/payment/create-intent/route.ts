import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { createPaymentIntent } from '@/lib/stripe';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  if (!request.headers.get('authorization')) {
    const ok = await (await import('@/lib/csrf')).validateCsrf(request);
    if (!ok) return NextResponse.json({ error: 'CSRF validation failed' }, { status: 403 });
  }
  
  try {
    const { workOrderId } = await request.json();
    
    // Get work order
    const workOrder = await prisma.workOrder.findUnique({
      where: { id: workOrderId },
      include: { customer: true },
    });
    
    if (!workOrder) {
      return NextResponse.json({ error: 'Work order not found' }, { status: 404 });
    }
    
    // Check authorization
    if (auth.role === 'customer' && workOrder.customerId !== auth.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    const estimate = workOrder.estimate as any;
    if (!estimate?.amount) {
      return NextResponse.json({ error: 'No estimate available' }, { status: 400 });
    }
    
    // Create payment intent
    const paymentIntent = await createPaymentIntent(estimate.amount, {
      workOrderId: workOrder.id,
      customerId: workOrder.customerId,
    });
    
    // Update work order
    await prisma.workOrder.update({
      where: { id: workOrderId },
      data: {
        paymentIntentId: paymentIntent.id,
        paymentStatus: 'pending',
      },
    });
    
    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      amount: estimate.amount,
    });
  } catch (error) {
    console.error('Payment intent error:', error);
    return NextResponse.json({ error: 'Failed to create payment intent' }, { status: 500 });
  }
}
