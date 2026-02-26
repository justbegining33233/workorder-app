import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { getRecurringById, updateRecurring, deleteRecurring, calcNextRunDate } from '@/lib/recurring-appointments';

// GET /api/appointments/recurring/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireRole(request, ['shop', 'manager']);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const appointment = getRecurringById(id);
  if (!appointment) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ appointment });
}

// PUT /api/appointments/recurring/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireRole(request, ['shop', 'manager']);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const existing = getRecurringById(id);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const shopId = auth.shopId ?? auth.id;
  if (existing.shopId !== shopId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();

  // If marking as "run", advance to next occurrence
  if (body.markRan) {
    const now = new Date().toISOString();
    const nextRunAt = calcNextRunDate(existing.nextRunAt, existing.frequency);
    const updated = updateRecurring(id, { lastRunAt: now, nextRunAt });
    return NextResponse.json({ appointment: updated });
  }

  const updated = updateRecurring(id, body);
  return NextResponse.json({ appointment: updated });
}

// DELETE /api/appointments/recurring/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireRole(request, ['shop', 'manager']);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const existing = getRecurringById(id);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const shopId = auth.shopId ?? auth.id;
  if (existing.shopId !== shopId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  deleteRecurring(id);
  return NextResponse.json({ success: true });
}
