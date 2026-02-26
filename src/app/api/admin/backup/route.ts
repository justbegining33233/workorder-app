import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// GET /api/admin/backup — export a full platform data snapshot as JSON
export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const decoded = verifyToken(token);
  if (!decoded || decoded.role !== 'admin') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }

  try {
    const [
      shops,
      customers,
      techs,
      workOrders,
      appointments,
      reviews,
      subscriptions,
      invoices,
      notifications,
    ] = await Promise.all([
      prisma.shop.findMany({ select: { id: true, shopName: true, email: true, status: true, createdAt: true, city: true, state: true } }),
      prisma.customer.findMany({ select: { id: true, firstName: true, lastName: true, email: true, createdAt: true } }),
      prisma.tech.findMany({ select: { id: true, firstName: true, lastName: true, email: true, role: true, shopId: true } }),
      prisma.workOrder.findMany({ select: { id: true, status: true, shopId: true, customerId: true, createdAt: true, totalAmount: true } }),
      prisma.appointment.findMany({ select: { id: true, status: true, scheduledDate: true, shopId: true, customerId: true } }),
      prisma.review.findMany({ select: { id: true, rating: true, comment: true, shopId: true, customerId: true, createdAt: true } }),
      prisma.subscription.findMany({ select: { id: true, plan: true, status: true, shopId: true, currentPeriodEnd: true } }),
      prisma.invoice.findMany({ select: { id: true, amount: true, status: true, shopId: true, createdAt: true } }),
      prisma.notification.findMany({ select: { id: true, type: true, title: true, customerId: true, read: true, createdAt: true } }),
    ]);

    const backup = {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      platform: 'FixTray',
      stats: {
        shops: shops.length,
        customers: customers.length,
        techs: techs.length,
        workOrders: workOrders.length,
        appointments: appointments.length,
        reviews: reviews.length,
        subscriptions: subscriptions.length,
        invoices: invoices.length,
        notifications: notifications.length,
      },
      data: {
        shops,
        customers,
        techs,
        workOrders,
        appointments,
        reviews,
        subscriptions,
        invoices,
        notifications,
      },
    };

    const filename = `fixtray-backup-${new Date().toISOString().slice(0, 10)}.json`;
    return new NextResponse(JSON.stringify(backup, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Backup error:', error);
    return NextResponse.json({ error: 'Backup failed' }, { status: 500 });
  }
}
