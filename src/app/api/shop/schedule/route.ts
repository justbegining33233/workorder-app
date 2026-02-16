import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// GET - Get shop's schedule settings
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded || !['shop', 'tech', 'manager'].includes(decoded.role)) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const shopId = decoded.shopId || decoded.id;

    // Get shop with scheduling info
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      select: {
        id: true,
        shopName: true,
        capacity: true,
        slotDuration: true,
        schedules: {
          orderBy: { dayOfWeek: 'asc' }
        },
        blockedDates: {
          where: {
            date: { gte: new Date() }
          },
          orderBy: { date: 'asc' }
        }
      }
    });

    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    // Create default schedule if none exists
    if (shop.schedules.length === 0) {
      const defaultSchedule = [];
      for (let day = 0; day < 7; day++) {
        defaultSchedule.push({
          shopId: shopId,
          dayOfWeek: day,
          isOpen: day !== 0 && day !== 6, // Closed on weekends by default
          openTime: '09:00',
          closeTime: '17:00'
        });
      }
      await prisma.shopSchedule.createMany({ data: defaultSchedule });
      
      // Re-fetch with created schedules
      const updatedShop = await prisma.shop.findUnique({
        where: { id: shopId },
        select: {
          id: true,
          shopName: true,
          capacity: true,
          slotDuration: true,
          schedules: {
            orderBy: { dayOfWeek: 'asc' }
          },
          blockedDates: {
            where: {
              date: { gte: new Date() }
            },
            orderBy: { date: 'asc' }
          }
        }
      });
      
      return NextResponse.json(updatedShop);
    }

    return NextResponse.json(shop);
  } catch (error) {
    console.error('Error fetching schedule:', error);
    return NextResponse.json({ error: 'Failed to fetch schedule' }, { status: 500 });
  }
}

// PUT - Update shop's schedule settings
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded || !['shop', 'manager'].includes(decoded.role)) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const shopId = decoded.shopId || decoded.id;
    const body = await request.json();
    const { capacity, slotDuration, schedules } = body;

    // Update shop capacity and slot duration
    if (capacity !== undefined || slotDuration !== undefined) {
      await prisma.shop.update({
        where: { id: shopId },
        data: {
          ...(capacity !== undefined && { capacity }),
          ...(slotDuration !== undefined && { slotDuration })
        }
      });
    }

    // Update schedules if provided
    if (schedules && Array.isArray(schedules)) {
      for (const schedule of schedules) {
        await prisma.shopSchedule.upsert({
          where: {
            shopId_dayOfWeek: {
              shopId: shopId,
              dayOfWeek: schedule.dayOfWeek
            }
          },
          update: {
            isOpen: schedule.isOpen,
            openTime: schedule.openTime,
            closeTime: schedule.closeTime
          },
          create: {
            shopId: shopId,
            dayOfWeek: schedule.dayOfWeek,
            isOpen: schedule.isOpen,
            openTime: schedule.openTime,
            closeTime: schedule.closeTime
          }
        });
      }
    }

    // Return updated schedule
    const updatedShop = await prisma.shop.findUnique({
      where: { id: shopId },
      select: {
        capacity: true,
        slotDuration: true,
        schedules: {
          orderBy: { dayOfWeek: 'asc' }
        }
      }
    });

    return NextResponse.json({ success: true, ...updatedShop });
  } catch (error) {
    console.error('Error updating schedule:', error);
    return NextResponse.json({ error: 'Failed to update schedule' }, { status: 500 });
  }
}
