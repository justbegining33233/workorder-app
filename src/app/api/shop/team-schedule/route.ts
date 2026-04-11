import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole, AuthUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const auth = requireRole(request, ['shop', 'manager', 'admin']);
  if (auth instanceof NextResponse) return auth;

  const user = auth as AuthUser;
  const { searchParams } = new URL(request.url);
  const shopId = user.role === 'admin'
    ? searchParams.get('shopId')
    : (user.shopId ?? user.id);

  if (!shopId) {
    return NextResponse.json({ error: 'Shop ID is required' }, { status: 400 });
  }

  try {
    // Get upcoming appointments for the next 7 days
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);

    const appointments = await prisma.appointment.findMany({
      where: {
        shopId,
        scheduledDate: {
          gte: startDate,
          lte: endDate,
        },
        status: 'scheduled',
      },
      include: {
        vehicle: {
          include: {
            customer: true,
          },
        },
      },
      orderBy: {
        scheduledDate: 'asc',
      },
      take: 10,
    });

    const schedule = appointments.map(appt => ({
      id: appt.id,
      customerName: appt.vehicle?.customer ? `${appt.vehicle.customer.firstName} ${appt.vehicle.customer.lastName}` : 'Unknown Customer',
      serviceType: appt.serviceType,
      scheduledDate: appt.scheduledDate,
      vehicleInfo: appt.vehicle ? `${appt.vehicle.year} ${appt.vehicle.make} ${appt.vehicle.model}` : 'Unknown Vehicle',
    }));

    return NextResponse.json({ schedule });
  } catch (error) {
    console.error('Error fetching team schedule:', error);
    return NextResponse.json({ error: 'Failed to fetch team schedule' }, { status: 500 });
  }
}