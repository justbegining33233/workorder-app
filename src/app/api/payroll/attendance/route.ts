import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';

// GET /api/payroll/attendance?startDate=&endDate=&techId=
// Returns time entries enriched with late/absent flags based on scheduled shifts
export async function GET(req: NextRequest) {
  const auth = authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = auth.role === 'shop' ? auth.id : (auth as any).shopId;
  if (!shopId) return NextResponse.json({ error: 'No shop context' }, { status: 400 });

  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get('startDate')
    ? new Date(searchParams.get('startDate')!)
    : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const endDate = searchParams.get('endDate')
    ? new Date(searchParams.get('endDate')!)
    : new Date();
  const techId = searchParams.get('techId');

  const where: any = { shopId, date: { gte: startDate, lte: endDate } };
  if (techId) where.techId = techId;

  // Get scheduled shifts
  const shifts = await prisma.shift.findMany({
    where,
    include: {
      tech: { select: { id: true, firstName: true, lastName: true, hourlyRate: true, jobTitle: true, department: true } },
    },
    orderBy: { date: 'asc' },
  });

  // Get actual time entries for same period
  const timeEntries = await prisma.timeEntry.findMany({
    where: {
      shopId,
      clockIn: { gte: startDate, lte: endDate },
      ...(techId && { techId }),
    },
    include: {
      tech: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  // Build attendance report: match shift to time entry
  const report = shifts.map((shift) => {
    const shiftDateStr = shift.date.toISOString().split('T')[0];
    const entry = timeEntries.find((e) => {
      const entryDateStr = e.clockIn.toISOString().split('T')[0];
      return e.techId === shift.techId && entryDateStr === shiftDateStr;
    });

    const scheduledStart = new Date(`${shiftDateStr}T${shift.startTime}:00`);
    let lateMinutes = 0;
    let status: string = shift.status;

    if (entry) {
      const diff = Math.round((entry.clockIn.getTime() - scheduledStart.getTime()) / 60000);
      lateMinutes = diff > 5 ? diff : 0; // 5-min grace period
      status = lateMinutes > 0 ? 'late' : 'present';
    } else if (new Date() > scheduledStart) {
      status = 'absent';
    }

    return {
      shiftId: shift.id,
      techId: shift.techId,
      tech: shift.tech,
      date: shift.date,
      scheduledStart: shift.startTime,
      scheduledEnd: shift.endTime,
      actualClockIn: entry?.clockIn ?? null,
      actualClockOut: entry?.clockOut ?? null,
      hoursWorked: entry?.hoursWorked ?? 0,
      lateMinutes,
      status,
      timeEntryId: entry?.id ?? null,
      approved: entry?.approved ?? false,
    };
  });

  // Also return any time entries that had no matching shift (unscheduled work)
  const matchedEntryIds = new Set(report.map((r) => r.timeEntryId).filter(Boolean));
  const unscheduled = timeEntries
    .filter((e) => !matchedEntryIds.has(e.id))
    .map((e) => ({
      shiftId: null,
      techId: e.techId,
      tech: e.tech,
      date: e.clockIn,
      scheduledStart: null,
      scheduledEnd: null,
      actualClockIn: e.clockIn,
      actualClockOut: e.clockOut,
      hoursWorked: e.hoursWorked ?? 0,
      lateMinutes: 0,
      status: 'unscheduled',
      timeEntryId: e.id,
      approved: e.approved,
    }));

  const summary = {
    totalShifts: shifts.length,
    present: report.filter((r) => r.status === 'present').length,
    late: report.filter((r) => r.status === 'late').length,
    absent: report.filter((r) => r.status === 'absent').length,
    unscheduled: unscheduled.length,
  };

  return NextResponse.json({ records: [...report, ...unscheduled], summary });
}
