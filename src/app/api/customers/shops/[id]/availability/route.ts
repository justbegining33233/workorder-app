import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('Availability request received');
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No auth header or not Bearer');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const secret = process.env.JWT_SECRET || 'your-secret-key-change-in-production-12345';
    let decoded;
    try {
      decoded = jwt.verify(token, secret) as { id: string; role: string };
    } catch (error) {
      console.log('Token verification failed');
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    if (decoded.role !== 'customer') {
      console.log('Role is not customer:', decoded.role);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const shopId = resolvedParams.id;
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const duration = parseInt(searchParams.get('duration') || '60');

    console.log('Shop ID:', shopId, 'Date:', date, 'Duration:', duration);

    if (!date) {
      return NextResponse.json({ error: 'Date parameter is required' }, { status: 400 });
    }

    // Parse date and get day of week (0 = Sunday, 6 = Saturday)
    const appointmentDate = new Date(date);
    const dayOfWeek = appointmentDate.getDay();
    console.log('Date:', date, 'Parsed date:', appointmentDate, 'Day of week:', dayOfWeek);

    // Get shop with schedule
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      include: {
        schedules: true
      }
    });

    console.log('Shop found:', !!shop, 'Schedules length:', shop?.schedules?.length);

    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    const schedule = shop.schedules.find(s => s.dayOfWeek === dayOfWeek);
    console.log('Schedule for day', dayOfWeek, ':', schedule);

    // Check if shop is open on this day
    if (!schedule || !schedule.isOpen) {
      console.log('Shop is closed or no schedule found');
      return NextResponse.json({
        available: false,
        reason: 'Shop is closed on this day',
        shopName: shop.shopName,
        capacity: shop.capacity,
        slotDuration: shop.slotDuration,
        slots: []
      });
    }

    // Get existing appointments for this date
    const startOfDay = new Date(appointmentDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(appointmentDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingAppointments = await prisma.appointment.findMany({
      where: {
        shopId,
        scheduledDate: {
          gte: startOfDay,
          lte: endOfDay
        },
        status: {
          in: ['confirmed', 'scheduled', 'pending']
        }
      },
      include: {
        vehicle: true
      }
    });

    console.log('Existing appointments:', existingAppointments.length);

    // Generate time slots
    const slots = [];
    const [openHour, openMinute] = schedule.openTime.split(':').map(Number);
    const [closeHour, closeMinute] = schedule.closeTime.split(':').map(Number);

    const openTime = openHour * 60 + openMinute;
    const closeTime = closeHour * 60 + closeMinute;
    const slotDuration = shop.slotDuration || 30;

    console.log('Open time:', openTime, 'Close time:', closeTime, 'Slot duration:', slotDuration);

    for (let time = openTime; time + duration <= closeTime; time += slotDuration) {
      const slotStart = new Date(appointmentDate);
      slotStart.setHours(Math.floor(time / 60), time % 60, 0, 0);

      const slotEnd = new Date(slotStart);
      slotEnd.setMinutes(slotStart.getMinutes() + duration);

      // Count overlapping appointments
      let bookedCount = 0;
      for (const appt of existingAppointments) {
        const apptStart = new Date(appt.scheduledDate);
        // For now, assume 60 minutes if no service duration available
        // TODO: Get duration from service type
        const apptDuration = 60; // Default duration
        const apptEnd = new Date(apptStart);
        apptEnd.setMinutes(apptStart.getMinutes() + apptDuration);

        // Check if slots overlap
        if (slotStart < apptEnd && slotEnd > apptStart) {
          bookedCount++;
        }
      }

      const available = bookedCount < (shop.capacity || 1);
      const timeString = slotStart.toTimeString().substring(0, 5); // HH:MM format

      slots.push({
        time: timeString,
        available,
        bookedCount
      });
    }

    console.log(`Generated ${slots.length} slots, ${slots.filter(s => s.available).length} available`);

    return NextResponse.json({
      available: slots.some(slot => slot.available),
      shopName: shop.shopName,
      capacity: shop.capacity,
      slotDuration: shop.slotDuration,
      businessHours: {
        open: schedule.openTime,
        close: schedule.closeTime
      },
      slots
    });

  } catch (error) {
    console.error('Error fetching availability:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}