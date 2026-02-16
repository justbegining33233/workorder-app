import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/middleware';

// GET - Get appointments
export async function GET(request: NextRequest) {
  // Use cookie/header-aware auth
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const shopId = searchParams.get('shopId');
    const status = searchParams.get('status');

    const where: any = {};

    // Filter by user role
    if ((auth as any).role === 'customer') {
      where.customerId = (auth as any).id;
    } else if ((auth as any).role === 'shop' || (auth as any).role === 'manager') {
      where.shopId = shopId || (auth as any).shopId;
    }

    if (customerId && ((auth as any).role === 'shop' || (auth as any).role === 'admin')) {
      where.customerId = customerId;
    }

    if (status) {
      where.status = status;
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        shop: {
          select: {
            id: true,
            shopName: true,
            phone: true,
            address: true,
            city: true,
            state: true,
          },
        },
        vehicle: {
          select: {
            id: true,
            make: true,
            model: true,
            year: true,
            vin: true,
          },
        },
      },
      orderBy: {
        scheduledDate: 'asc',
      },
    });

    return NextResponse.json({ appointments });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create appointment
export async function POST(request: NextRequest) {
  // Use cookie/header-aware auth
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { shopId, vehicleId, scheduledDate, serviceType, notes } = body;

    if (!shopId || !scheduledDate || !serviceType) {
      return NextResponse.json(
        { error: 'Shop ID, scheduled date, and service type are required' },
        { status: 400 }
      );
    }

    // Get vehicle info if provided
    let vehicle = null;
    if (vehicleId) {
      vehicle = await prisma.vehicle.findFirst({
        where: {
          id: vehicleId,
          customerId: (auth as any).id,
        },
      });

      if (!vehicle) {
        return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
      }
    }

    // Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        customerId: (auth as any).id,
        shopId,
        vehicleId: vehicleId || null,
        scheduledDate: new Date(scheduledDate),
        serviceType,
        notes: notes || null,
        status: 'scheduled',
      },
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        shop: {
          select: {
            shopName: true,
            phone: true,
          },
        },
        vehicle: {
          select: {
            make: true,
            model: true,
            year: true,
            vehicleType: true,
          },
        },
      },
    });

    // Create a work order for this appointment
    const workOrder = await prisma.workOrder.create({
      data: {
        customerId: (auth as any).id,
        shopId,
        vehicleId: vehicleId || null,
        vehicleType: vehicle?.vehicleType || appointment.vehicle?.vehicleType || 'gas',
        serviceLocation: 'in-shop',
        issueDescription: `Appointment: ${serviceType}${notes ? `\n\nCustomer Notes: ${notes}` : ''}`,
        maintenance: serviceType,
        status: 'pending',
        dueDate: new Date(scheduledDate),
      },
    });

    // If customer provided notes, start a message thread
    if (notes && notes.trim()) {
      await prisma.customerMessage.create({
        data: {
          customerId: (auth as any).id,
          workOrderId: workOrder.id,
          from: 'customer',
          content: notes.trim(),
          read: false,
        },
      });
    }

    return NextResponse.json({ 
      appointment,
      workOrderId: workOrder.id,
      messageThreadStarted: !!(notes && notes.trim()),
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating appointment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
