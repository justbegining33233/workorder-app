import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  if (!['shop', 'manager', 'admin'].includes(auth.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const shopId = auth.role === 'shop' ? auth.id : auth.shopId;
  if (!shopId) {
    return NextResponse.json({ error: 'Shop not found' }, { status: 400 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');
    
    // Default to today
    const targetDate = dateParam ? new Date(dateParam) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Jobs completed today
    const completedJobs = await prisma.workOrder.findMany({
      where: {
        shopId,
        completedAt: { gte: startOfDay, lte: endOfDay },
      },
      include: {
        customer: { select: { firstName: true, lastName: true } },
        assignedTo: { select: { firstName: true, lastName: true } },
      },
      orderBy: { completedAt: 'desc' },
    });

    // Jobs created today
    const newJobs = await prisma.workOrder.count({
      where: {
        shopId,
        createdAt: { gte: startOfDay, lte: endOfDay },
      },
    });

    // Jobs still open
    const openJobs = await prisma.workOrder.count({
      where: {
        shopId,
        status: { notIn: ['closed', 'denied-estimate'] },
      },
    });

    // Payment breakdown from work orders paid today
    const paidJobsToday = await prisma.workOrder.findMany({
      where: {
        shopId,
        paymentStatus: 'paid',
        updatedAt: { gte: startOfDay, lte: endOfDay },
      },
      select: { amountPaid: true },
    });

    const totalRevenue = paidJobsToday.reduce((sum, j) => sum + (j.amountPaid || 0), 0);
    const paymentBreakdown = {
      cash: 0,
      card: totalRevenue,
      check: 0,
      transfer: 0,
      other: 0,
      total: totalRevenue,
    };

    // Outstanding balances (work orders waiting for payment)
    const outstandingWOs = await prisma.workOrder.findMany({
      where: {
        shopId,
        status: 'waiting-for-payment',
      },
      select: {
        id: true,
        estimatedCost: true,
        amountPaid: true,
        customer: { select: { firstName: true, lastName: true } },
      },
    });

    const outstandingBalance = outstandingWOs.reduce((sum, wo) => {
      const owed = (wo.estimatedCost || 0) - (wo.amountPaid || 0);
      return sum + Math.max(0, owed);
    }, 0);

    // Tech hours (time entries)
    const timeEntries = await prisma.timeEntry.findMany({
      where: {
        shopId,
        clockIn: { gte: startOfDay, lte: endOfDay },
      },
      include: {
        tech: { select: { firstName: true, lastName: true } },
      },
    });

    const techHours = timeEntries.map(entry => {
      const clockOut = entry.clockOut || new Date();
      const hours = (clockOut.getTime() - entry.clockIn.getTime()) / (1000 * 60 * 60);
      return {
        techName: `${entry.tech.firstName} ${entry.tech.lastName}`,
        hours: Math.round(hours * 100) / 100,
        clockIn: entry.clockIn,
        clockOut: entry.clockOut,
      };
    });

    // Appointments today
    const appointments = await prisma.appointment.count({
      where: {
        shopId,
        scheduledDate: { gte: startOfDay, lte: endOfDay },
      },
    });

    return NextResponse.json({
      date: targetDate.toISOString().split('T')[0],
      summary: {
        completedJobsCount: completedJobs.length,
        newJobsCount: newJobs,
        openJobsCount: openJobs,
        appointmentsCount: appointments,
        outstandingBalance: Math.round(outstandingBalance * 100) / 100,
      },
      paymentBreakdown,
      completedJobs: completedJobs.map(j => ({
        id: j.id,
        customer: j.customer ? `${j.customer.firstName} ${j.customer.lastName}` : 'N/A',
        tech: j.assignedTo ? `${j.assignedTo.firstName} ${j.assignedTo.lastName}` : 'Unassigned',
        amount: j.amountPaid || j.estimatedCost || 0,
        vehicleType: j.vehicleType,
        completedAt: j.completedAt,
      })),
      outstandingWOs: outstandingWOs.map(wo => ({
        id: wo.id,
        customer: wo.customer ? `${wo.customer.firstName} ${wo.customer.lastName}` : 'N/A',
        owed: Math.max(0, (wo.estimatedCost || 0) - (wo.amountPaid || 0)),
      })),
      techHours,
    });
  } catch (error) {
    console.error('Error generating EOD report:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
