import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { validateCsrf } from '@/lib/csrf';

// Helper function to calculate distance between two GPS coordinates (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

// GET - Get time entries for a tech/manager
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const techId = searchParams.get('techId');
    const shopId = searchParams.get('shopId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build query
    const where: any = {};
    
    if (techId) {
      where.techId = techId;
    } else if (shopId) {
      where.shopId = shopId;
    } else {
      return NextResponse.json({ error: 'Either techId or shopId required' }, { status: 400 });
    }

    if (startDate && endDate) {
      where.clockIn = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const timeEntries = await prisma.timeEntry.findMany({
      where,
      include: {
        tech: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            hourlyRate: true,
          },
        },
      },
      orderBy: { clockIn: 'desc' },
    });

    return NextResponse.json({ timeEntries });
  } catch (error) {
    console.error('Error fetching time entries:', error);
    return NextResponse.json({ error: 'Failed to fetch time entries' }, { status: 500 });
  }
}

// POST - Clock in or clock out
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { action, techId, shopId, notes, location, photo } = await request.json();

    if (!action || !techId || !shopId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (action === 'clock-in') {
      // Check if already clocked in
      const existingEntry = await prisma.timeEntry.findFirst({
        where: {
          techId,
          clockOut: null,
        },
      });

      if (existingEntry) {
        return NextResponse.json({ 
          error: 'Already clocked in', 
          entry: existingEntry 
        }, { status: 400 });
      }

      // Verify GPS location if enabled
      if (location) {
        const shopSettings = await prisma.shopSettings.findFirst({
          where: { shopId },
        });

        if (shopSettings?.gpsVerificationEnabled && shopSettings.shopLatitude && shopSettings.shopLongitude) {
          const distance = calculateDistance(
            location.lat,
            location.lon,
            shopSettings.shopLatitude,
            shopSettings.shopLongitude
          );

          const radiusMeters = shopSettings.gpsRadiusMeters || 100;
          if (distance > radiusMeters) {
            return NextResponse.json({ 
              error: `You must be within ${radiusMeters}m of the shop to clock in (currently ${Math.round(distance)}m away)` 
            }, { status: 400 });
          }
        }
      }

      // Create new time entry
      const timeEntry = await prisma.timeEntry.create({
        data: {
          techId,
          shopId,
          clockIn: new Date(),
          notes,
          location,
          clockInPhoto: photo,
        },
        include: {
          tech: {
            select: {
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },
      });

      return NextResponse.json({ 
        success: true, 
        message: 'Clocked in successfully',
        timeEntry 
      });
    } else if (action === 'clock-out') {
      // Find the active time entry
      const activeEntry = await prisma.timeEntry.findFirst({
        where: {
          techId,
          clockOut: null,
        },
      });

      if (!activeEntry) {
        return NextResponse.json({ error: 'No active clock-in found' }, { status: 400 });
      }

      const clockOut = new Date();
      let workDuration = clockOut.getTime() - activeEntry.clockIn.getTime();

      // Subtract break time if any
      if (activeEntry.breakStart && activeEntry.breakEnd) {
        const breakDuration = new Date(activeEntry.breakEnd).getTime() - new Date(activeEntry.breakStart).getTime();
        workDuration -= breakDuration;
      }

      const hoursWorked = workDuration / (1000 * 60 * 60);

      // Update time entry with clock out
      const updatedEntry = await prisma.timeEntry.update({
        where: { id: activeEntry.id },
        data: {
          clockOut,
          hoursWorked: Math.round(hoursWorked * 100) / 100,
          notes: notes || activeEntry.notes,
          clockOutPhoto: photo,
        },
        include: {
          tech: {
            select: {
              firstName: true,
              lastName: true,
              role: true,
              hourlyRate: true,
            },
          },
        },
      });

      return NextResponse.json({ 
        success: true, 
        message: 'Clocked out successfully',
        timeEntry: updatedEntry,
        hoursWorked: updatedEntry.hoursWorked,
      });
    } else if (action === 'break-start') {
      const activeEntry = await prisma.timeEntry.findFirst({
        where: {
          techId,
          clockOut: null,
        },
      });

      if (!activeEntry) {
        return NextResponse.json({ error: 'No active clock-in found' }, { status: 400 });
      }

      if (activeEntry.breakStart) {
        return NextResponse.json({ error: 'Break already started' }, { status: 400 });
      }

      const updatedEntry = await prisma.timeEntry.update({
        where: { id: activeEntry.id },
        data: {
          breakStart: new Date(),
        },
      });

      return NextResponse.json({ 
        success: true, 
        message: 'Break started',
        timeEntry: updatedEntry,
      });
    } else if (action === 'break-end') {
      const activeEntry = await prisma.timeEntry.findFirst({
        where: {
          techId,
          clockOut: null,
        },
      });

      if (!activeEntry) {
        return NextResponse.json({ error: 'No active clock-in found' }, { status: 400 });
      }

      if (!activeEntry.breakStart) {
        return NextResponse.json({ error: 'No break in progress' }, { status: 400 });
      }

      const breakEnd = new Date();
      const breakDuration = (breakEnd.getTime() - new Date(activeEntry.breakStart).getTime()) / (1000 * 60); // minutes

      const updatedEntry = await prisma.timeEntry.update({
        where: { id: activeEntry.id },
        data: {
          breakEnd,
          breakDuration: Math.round(breakDuration * 100) / 100,
        },
      });

      return NextResponse.json({ 
        success: true, 
        message: 'Break ended',
        timeEntry: updatedEntry,
        breakDuration: updatedEntry.breakDuration,
      });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error with time tracking:', error);
    return NextResponse.json({ error: 'Time tracking operation failed' }, { status: 500 });
  }
}
