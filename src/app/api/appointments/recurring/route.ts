import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { getRecurringByShop, createRecurring, calcNextRunDate } from '@/lib/recurring-appointments';
import type { RecurringFrequency } from '@/lib/recurring-appointments';

// GET /api/appointments/recurring — List all recurring appointments for the shop
export async function GET(request: NextRequest) {
  const auth = requireRole(request, ['shop', 'manager']);
  if (auth instanceof NextResponse) return auth;

  const shopId = auth.shopId ?? auth.id;
  const appointments = getRecurringByShop(shopId);

  return NextResponse.json({ appointments });
}

// POST /api/appointments/recurring — Create a new recurring appointment
export async function POST(request: NextRequest) {
  const auth = requireRole(request, ['shop', 'manager']);
  if (auth instanceof NextResponse) return auth;

  const shopId = auth.shopId ?? auth.id;
  const body = await request.json();

  const { customerId, customerName, vehicleInfo, serviceType, frequency, startDate, notes } = body;

  if (!customerName || !serviceType || !frequency) {
    return NextResponse.json(
      { error: 'customerName, serviceType, and frequency are required' },
      { status: 400 }
    );
  }

  const validFrequencies: RecurringFrequency[] = ['weekly', 'biweekly', 'monthly', 'quarterly', 'annually'];
  if (!validFrequencies.includes(frequency)) {
    return NextResponse.json({ error: 'Invalid frequency' }, { status: 400 });
  }

  const nextRunAt = startDate ?? new Date().toISOString();

  const appointment = createRecurring(shopId, {
    customerId: customerId ?? '',
    customerName,
    vehicleInfo: vehicleInfo ?? '',
    serviceType,
    frequency,
    nextRunAt,
    lastRunAt: null,
    notes: notes ?? '',
    status: 'active',
  });

  return NextResponse.json({ appointment }, { status: 201 });
}
