import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendSms } from '@/lib/smsService';

// Cron secret to prevent unauthorized access
const CRON_SECRET = process.env.CRON_SECRET;

function verifyCron(request: NextRequest): boolean {
  // In production, CRON_SECRET is required
  if (!CRON_SECRET) {
    if (process.env.NODE_ENV === 'production' || process.env.VERCEL) return false;
    return true; // Allow in local dev only
  }
  const auth = request.headers.get('authorization');
  return auth === `Bearer ${CRON_SECRET}`;
}

export async function GET(request: NextRequest) {
  if (!verifyCron(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: Record<string, any> = {};
  const now = new Date();

  // ─── 1. Appointment Reminders (24h before) ───
  try {
    const reminderWindow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const reminderStart = new Date(now.getTime() + 23 * 60 * 60 * 1000);

    const upcomingAppointments = await prisma.appointment.findMany({
      where: {
        scheduledDate: { gte: reminderStart, lte: reminderWindow },
        status: { in: ['scheduled', 'confirmed'] },
      },
      include: {
        customer: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        shop: { select: { shopName: true, phone: true } },
      },
    });

    // Create in-app notifications for upcoming appointments
    let reminderCount = 0;
    for (const appt of upcomingAppointments) {
      // Check if reminder already sent
      const existing = await prisma.notification.findFirst({
        where: {
          customerId: appt.customerId,
          type: 'appointment_reminder',
          appointmentId: appt.id,
        },
      });
      if (existing) continue;

      await prisma.notification.create({
        data: {
          customerId: appt.customerId,
          type: 'appointment_reminder',
          title: 'Upcoming Appointment',
          message: `Reminder: You have an appointment at ${appt.shop.shopName} tomorrow for ${appt.serviceType}.`,
          appointmentId: appt.id,
          deliveryMethod: 'in-app,sms',
        },
      });

      // Send SMS reminder
      if (appt.customer.phone) {
        const dateStr = new Date(appt.scheduledDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
        sendSms(
          appt.customer.phone,
          `FixTray: Reminder — your appointment at ${appt.shop.shopName} is tomorrow (${dateStr}) for ${appt.serviceType}. Reply HELP for info.`
        ).catch(() => {});
      }

      reminderCount++;
    }
    results.appointmentReminders = { sent: reminderCount, checked: upcomingAppointments.length };
  } catch (error) {
    console.error('Appointment reminders error:', error);
    results.appointmentReminders = { error: 'Failed' };
  }

  // ─── 2. Low Stock Alerts ───
  try {
    const lowStockItems = await prisma.inventoryItem.findMany({
      where: {
        reorderPoint: { not: null },
        type: 'part',
      },
      include: {
        shop: { select: { id: true, shopName: true, email: true } },
      },
    });

    // Filter items where quantity <= reorderPoint
    const needsReorder = lowStockItems.filter(item => item.quantity <= (item.reorderPoint ?? 0));

    // Group by shop
    const byShop: Record<string, { shopName: string; items: string[] }> = {};
    for (const item of needsReorder) {
      if (!byShop[item.shopId]) {
        byShop[item.shopId] = { shopName: item.shop.shopName, items: [] };
      }
      byShop[item.shopId].items.push(`${item.name} (${item.quantity} left, reorder at ${item.reorderPoint})`);
    }

    // Create notifications for each shop (once per day — check existing)
    let alertCount = 0;
    const todayStr = now.toISOString().split('T')[0];
    for (const [shopId, data] of Object.entries(byShop)) {
      // Low stock alerts go to the first customer associated with the shop, or skip
      // Since Notification requires customerId, we create a log instead
      // For shop-facing alerts, we check if there's a recent one
      const existing = await prisma.notification.findFirst({
        where: {
          type: 'low_stock_alert',
          createdAt: { gte: new Date(todayStr) },
          metadata: { contains: shopId },
        },
      });
      if (existing) continue;

      // Find the shop owner (first tech or use a placeholder)
      // Store as metadata since this is a shop-facing notification
      const shopCustomers = await prisma.workOrder.findFirst({
        where: { shopId },
        select: { customerId: true },
      });
      if (!shopCustomers) continue;

      await prisma.notification.create({
        data: {
          customerId: shopCustomers.customerId,
          type: 'low_stock_alert',
          title: 'Low Stock Alert',
          message: `${data.items.length} item(s) are at or below reorder point: ${data.items.slice(0, 3).join(', ')}${data.items.length > 3 ? ` and ${data.items.length - 3} more` : ''}.`,
          deliveryMethod: 'in-app',
          metadata: JSON.stringify({ shopId, shopName: data.shopName }),
        },
      });
      alertCount++;
    }
    results.lowStockAlerts = { shopsNotified: alertCount, totalLowItems: needsReorder.length };
  } catch (error) {
    console.error('Low stock alerts error:', error);
    results.lowStockAlerts = { error: 'Failed' };
  }

  // ─── 3. Recurring Work Order Generation ───
  try {
    const dueRecurring = await prisma.recurringWorkOrder.findMany({
      where: {
        active: true,
        nextRunAt: { lte: now },
      },
      include: {
        shop: { select: { id: true, shopName: true } },
        customer: { select: { id: true, firstName: true, lastName: true, phone: true } },
      },
    });

    let createdCount = 0;
    for (const rec of dueRecurring) {
      // Create the work order
      await prisma.workOrder.create({
        data: {
          customerId: rec.customerId,
          shopId: rec.shopId,
          vehicleId: rec.vehicleId,
          vehicleType: rec.vehicleType || 'Standard',
          serviceLocation: 'in-shop',
          issueDescription: rec.title || rec.issueDescription || 'Recurring Service',
          status: rec.requiresApproval ? 'pending' : 'assigned',
          estimatedCost: rec.estimatedCost,
        },
      });

      // SMS notification for recurring work order created
      if (rec.customer.phone) {
        sendSms(
          rec.customer.phone,
          `FixTray: Your recurring service "${rec.title || 'Scheduled Maintenance'}" at ${rec.shop.shopName} has been created. Log in at fixtray.app/customer to review.`
        ).catch(() => {});
      }

      // Calculate next run date
      const nextRun = new Date(rec.nextRunAt!);
      switch (rec.frequency) {
        case 'weekly': nextRun.setDate(nextRun.getDate() + 7); break;
        case 'biweekly': nextRun.setDate(nextRun.getDate() + 14); break;
        case 'monthly': nextRun.setMonth(nextRun.getMonth() + 1); break;
        case 'quarterly': nextRun.setMonth(nextRun.getMonth() + 3); break;
        case 'annually': nextRun.setFullYear(nextRun.getFullYear() + 1); break;
        default: nextRun.setMonth(nextRun.getMonth() + 1);
      }

      await prisma.recurringWorkOrder.update({
        where: { id: rec.id },
        data: {
          lastRunAt: now,
          nextRunAt: nextRun,
        },
      });

      createdCount++;
    }
    results.recurringWorkOrders = { created: createdCount, checked: dueRecurring.length };
  } catch (error) {
    console.error('Recurring work orders error:', error);
    results.recurringWorkOrders = { error: 'Failed' };
  }

  return NextResponse.json({
    success: true,
    timestamp: now.toISOString(),
    results,
  });
}
