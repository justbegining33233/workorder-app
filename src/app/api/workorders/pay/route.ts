import { NextRequest, NextResponse } from 'next/server';
import { getWorkOrderById, updateWorkOrder } from '@/lib/workorders';
import { requireAuth } from '@/lib/middleware';
import { validateCsrf } from '@/lib/csrf';

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  // Only shops/managers/admins can mark a work order as paid
  if (!['shop', 'manager', 'admin'].includes(auth.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    if (!req.headers.get('authorization')) {
      const ok = await validateCsrf(req);
      if (!ok) return NextResponse.json({ error: 'CSRF validation failed' }, { status: 403 });
    }
    const { workOrderId } = await req.json();
    const wo = await getWorkOrderById(workOrderId);
    
    if (!wo) {
      return NextResponse.json({ error: 'Work order not found' }, { status: 404 });
    }
    
    if (wo.status !== 'waiting-for-payment') {
      return NextResponse.json({ error: 'Work order must be waiting-for-payment' }, { status: 400 });
    }
    
    const updated = await updateWorkOrder(workOrderId, { status: 'closed' });
    return NextResponse.json(updated);
  } catch (e) {
    console.error('Failed to mark as paid', e);
    return NextResponse.json({ error: 'Failed to mark as paid' }, { status: 500 });
  }
}
