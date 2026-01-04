import { NextRequest, NextResponse } from 'next/server';
import { getWorkOrderById, updateWorkOrder } from '@/lib/workorders';
import { validateCsrf } from '@/lib/csrf';

export async function POST(request: NextRequest) {
  try {
    if (!request.headers.get('authorization')) {
      const ok = await validateCsrf(request);
      if (!ok) return NextResponse.json({ error: 'CSRF validation failed' }, { status: 403 });
    }
    const { workOrderId, amount, method, notes } = await request.json();

    const workOrder = getWorkOrderById(workOrderId);
    if (!workOrder) {
      return NextResponse.json({ error: 'Work order not found' }, { status: 404 });
    }

    const payment = {
      id: `pay-${Date.now()}`,
      amount,
      method,
      receivedAt: new Date(),
      receivedBy: request.headers.get('x-user-role') || 'manager',
      notes,
    };

    const payments = [...(workOrder.payments || []), payment];
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

    // Auto-close if fully paid
    let status = workOrder.status;
    if (totalPaid >= (workOrder.estimate?.amount || 0) && status === 'waiting-for-payment') {
      status = 'closed';
    }

    const updated = updateWorkOrder(workOrderId, { 
      payments,
      status,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error recording payment:', error);
    return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 });
  }
}
