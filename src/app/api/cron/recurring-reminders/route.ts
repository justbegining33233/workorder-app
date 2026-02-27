/**
 * GET /api/cron/recurring-reminders
 * POST /api/cron/recurring-reminders
 *
 * Sends advance reminder emails for recurring work orders:
 *   - 14 days before nextRunAt: "Hey, your Oil Change is coming up in 2 weeks — would you like to schedule it?"
 *   -  7 days before nextRunAt: "Your Oil Change is ONE WEEK away — schedule now at [shop link]"
 *
 * Uses reminder14SentAt / reminder7SentAt to prevent duplicate emails.
 * Run this cron daily.
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendRecurringReminderEmail } from '@/lib/emailService';

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

async function processReminders() {
  const now = new Date();
  // target dates ±12 hours
  const window12h = 12 * 60 * 60 * 1000;

  const target14 = addDays(now, 14);
  const target7  = addDays(now, 7);

  const sent14: string[] = [];
  const sent7:  string[] = [];
  const errors: string[] = [];

  // â”€â”€ 14-day reminders â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const due14 = await prisma.recurringWorkOrder.findMany({
    where: {
      active: true,
      nextRunAt: {
        gte: new Date(target14.getTime() - window12h),
        lte: new Date(target14.getTime() + window12h),
      },
      reminder14SentAt: null, // haven't sent 14-day reminder yet
    },
    include: {
      customer: { select: { firstName: true, lastName: true, email: true } },
      shop:     { select: { id: true, shopName: true } },
    },
  });

  for (const schedule of due14) {
    try {
      const customerName = `${schedule.customer.firstName} ${schedule.customer.lastName}`;
      await sendRecurringReminderEmail(
        schedule.customer.email,
        customerName,
        schedule.title,
        schedule.shop.shopName,
        schedule.shop.id,
        14,
        schedule.estimatedCost
      );

      await prisma.recurringWorkOrder.update({
        where: { id: schedule.id },
        data: { reminder14SentAt: now },
      });

      sent14.push(schedule.id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`14d:${schedule.id}:${msg}`);
      console.error(`[Reminder] Failed 14-day reminder for schedule ${schedule.id}:`, msg);
    }
  }

  // â”€â”€ 7-day reminders â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const due7 = await prisma.recurringWorkOrder.findMany({
    where: {
      active: true,
      nextRunAt: {
        gte: new Date(target7.getTime() - window12h),
        lte: new Date(target7.getTime() + window12h),
      },
      reminder7SentAt: null, // haven't sent 7-day reminder yet
    },
    include: {
      customer: { select: { firstName: true, lastName: true, email: true } },
      shop:     { select: { id: true, shopName: true } },
    },
  });

  for (const schedule of due7) {
    try {
      const customerName = `${schedule.customer.firstName} ${schedule.customer.lastName}`;
      await sendRecurringReminderEmail(
        schedule.customer.email,
        customerName,
        schedule.title,
        schedule.shop.shopName,
        schedule.shop.id,
        7,
        schedule.estimatedCost
      );

      await prisma.recurringWorkOrder.update({
        where: { id: schedule.id },
        data: { reminder7SentAt: now },
      });

      sent7.push(schedule.id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`7d:${schedule.id}:${msg}`);
      console.error(`[Reminder] Failed 7-day reminder for schedule ${schedule.id}:`, msg);
    }
  }

  return { sent14: sent14.length, sent7: sent7.length, errors };
}

export async function GET(request: NextRequest) {
  const secret     = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');
  const cronHeader = request.headers.get('x-cron-secret');

  if (!secret && process.env.NODE_ENV === 'production') {
    console.error('[Cron] FATAL: CRON_SECRET is not set — recurring-reminders GET is unprotected in production!');
  }
  if (secret && authHeader !== `Bearer ${secret}` && cronHeader !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await processReminders();
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Reminders] GET error:', msg);
    return NextResponse.json({ error: 'Reminder job failed', detail: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const secret     = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');
  const cronHeader = request.headers.get('x-cron-secret');

  if (!secret && process.env.NODE_ENV === 'production') {
    console.error('[Cron] FATAL: CRON_SECRET is not set — recurring-reminders POST is unprotected in production!');
  }
  if (secret && authHeader !== `Bearer ${secret}` && cronHeader !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await processReminders();
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Reminders] POST error:', msg);
    return NextResponse.json({ error: 'Reminder job failed', detail: msg }, { status: 500 });
  }
}
