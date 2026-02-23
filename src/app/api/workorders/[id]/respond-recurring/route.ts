/**
 * POST /api/workorders/[id]/respond-recurring
 *
 * Customer confirms or skips a recurring work order that's awaiting their approval.
 *
 * Body: { action: 'confirm' | 'skip' }
 *
 * confirm → sets status to 'pending', shop sees it in their queue, bay is now reserved
 * skip    → deletes the work order, no bay reserved, schedule's nextRunAt already advanced
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/middleware';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  if (auth.role !== 'customer') {
    return NextResponse.json({ error: 'Customers only' }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const action = body.action as 'confirm' | 'skip';

  if (action !== 'confirm' && action !== 'skip') {
    return NextResponse.json({ error: 'action must be "confirm" or "skip"' }, { status: 400 });
  }

  const workOrder = await prisma.workOrder.findUnique({ where: { id }, include: { shop: { select: { shopName: true } } } });

  if (!workOrder) {
    return NextResponse.json({ error: 'Work order not found' }, { status: 404 });
  }

  if (workOrder.customerId !== auth.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  if (workOrder.status !== 'awaiting-confirmation') {
    return NextResponse.json({ error: 'This work order is not awaiting confirmation' }, { status: 409 });
  }

  if (action === 'confirm') {
    const updated = await prisma.workOrder.update({
      where: { id },
      data: { status: 'pending' },
    });

    return NextResponse.json({
      success: true,
      action: 'confirmed',
      message: `Your ${workOrder.shop?.shopName ?? 'shop'} has been notified. Your visit is now scheduled.`,
      workOrderId: updated.id,
    });
  }

  // skip — delete the work order
  await prisma.workOrder.delete({ where: { id } });

  return NextResponse.json({
    success: true,
    action: 'skipped',
    message: 'Skipped. No bay has been reserved. See you next time!',
  });
}
