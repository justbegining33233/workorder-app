import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/cron/appointment-reminders
// Called by a cron job (e.g., Vercel cron, external scheduler) to send reminder notifications
// Sends reminders for appointments happening in the next 24 hours that haven't been reminded yet

export async function GET(request: NextRequest) {
  // Protect with a simple cron secret
  const cronSecret = request.headers.get('x-cron-secret') || request.nextUrl.searchParams.get('secret');
  const expectedSecret = process.env.CRON_SECRET || 'fixtray-cron-2024';
  if (!process.env.CRON_SECRET && process.env.NODE_ENV === 'production') {
    console.error('[Cron] FATAL: CRON_SECRET is not set — appointment-reminders is using insecure fallback in production!');
  }
  if (cronSecret !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in25h = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    // Find scheduled appointments in the next 24-25 hour window that haven't been reminded
    const upcoming = await prisma.appointment.findMany({
      where: {
        scheduledDate: { gte: in24h, lte: in25h },
        status: { in: ['scheduled', 'confirmed'] },
      },
      include: {
        customer: { select: { id: true, firstName: true, lastName: true, email: true } },
        shop: { select: { shopName: true, address: true, city: true, state: true, phone: true } },
        vehicle: { select: { make: true, model: true, year: true } },
      },
    });

    let sent = 0;
    const errors: string[] = [];

    for (const appointment of upcoming) {
      try {
        const apptTime = new Date(appointment.scheduledDate).toLocaleString('en-US', {
          weekday: 'short', month: 'short', day: 'numeric',
          hour: 'numeric', minute: '2-digit', hour12: true,
        });

        const vehicleInfo = appointment.vehicle
          ? `${appointment.vehicle.year || ''} ${appointment.vehicle.make} ${appointment.vehicle.model}`.trim()
          : 'your vehicle';

        // Create in-app notification for the customer
        await prisma.notification.create({
          data: {
            customerId: appointment.customer.id,
            type: 'appointment_reminder',
            title: 'Appointment Reminder',
            message: `Your appointment at ${appointment.shop.shopName} is tomorrow at ${apptTime} for ${vehicleInfo}. ${appointment.shop.address ? `Address: ${appointment.shop.address}, ${appointment.shop.city}, ${appointment.shop.state}` : ''} ${appointment.shop.phone ? `Phone: ${appointment.shop.phone}` : ''}`,
            appointmentId: appointment.id,
            deliveryMethod: 'in-app',
          },
        });

        sent++;
      } catch (err: any) {
        errors.push(`Appointment ${appointment.id}: ${err.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      appointmentsFound: upcoming.length,
      remindersSent: sent,
      errors,
    });
  } catch (error) {
    console.error('Appointment reminders error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
