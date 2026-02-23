/**
 * POST /api/cron/recurring-workorders
 *
 * Creates work orders for all active recurring schedules whose nextRunAt <= now.
 * Secured via CRON_SECRET header (set in Vercel env as CRON_SECRET=your-secret).
 * Trigger from Vercel Cron or any scheduler hitting this endpoint daily.
 *
 * Vercel cron config (vercel.json):
 *   { "crons": [{ "path": "/api/cron/recurring-workorders", "schedule": "0 8 * * *" }] }
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

function nextRunDate(frequency: string, from: Date = new Date()): Date {
  const d = new Date(from);
  switch (frequency) {
    case 'weekly':    d.setDate(d.getDate() + 7); break;
    case 'biweekly':  d.setDate(d.getDate() + 14); break;
    case 'monthly':   d.setMonth(d.getMonth() + 1); break;
    case 'quarterly': d.setMonth(d.getMonth() + 3); break;
    case 'annually':  d.setFullYear(d.getFullYear() + 1); break;
    default:          d.setMonth(d.getMonth() + 1);
  }
  return d;
}

export async function POST(request: NextRequest) {
  // Auth: accept either CRON_SECRET header or Vercel's built-in Authorization header
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');
  const cronHeader = request.headers.get('x-cron-secret');

  if (secret && authHeader !== `Bearer ${secret}` && cronHeader !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();

  try {
    // Find all active recurring schedules that are due
    const due = await prisma.recurringWorkOrder.findMany({
      where: {
        active: true,
        nextRunAt: { lte: now },
      },
    });

    if (due.length === 0) {
      return NextResponse.json({ success: true, created: 0, message: 'No schedules due' });
    }

    const created: string[] = [];

    for (const schedule of due) {
      try {
        // Create a new work order from the template
        const workOrder = await prisma.workOrder.create({
          data: {
            customerId: schedule.customerId,
            shopId: schedule.shopId,
            vehicleId: schedule.vehicleId || null,
            vehicleType: schedule.vehicleType,
            serviceLocation: schedule.serviceLocation,
            issueDescription: `[Recurring] ${schedule.title} — ${schedule.issueDescription}`,
            estimatedCost: schedule.estimatedCost || null,
            status: 'pending',
            paymentStatus: 'unpaid',
          },
        });

        created.push(workOrder.id);

        // Advance nextRunAt and update lastRunAt
        await prisma.recurringWorkOrder.update({
          where: { id: schedule.id },
          data: {
            lastRunAt: now,
            nextRunAt: nextRunDate(schedule.frequency, now),
          },
        });

        console.log(`[Cron] Created recurring work order ${workOrder.id} from schedule ${schedule.id}`);
      } catch (err) {
        console.error(`[Cron] Failed to create WO for schedule ${schedule.id}:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      created: created.length,
      workOrderIds: created,
    });
  } catch (err) {
    console.error('[Cron] Recurring work orders error:', err);
    return NextResponse.json({ error: 'Cron job failed' }, { status: 500 });
  }
}

// Allow GET for health checks
export async function GET() {
  const now = new Date();
  const dueCount = await prisma.recurringWorkOrder.count({
    where: { active: true, nextRunAt: { lte: now } },
  });
  return NextResponse.json({ status: 'ok', dueNow: dueCount, checkedAt: now });
}
