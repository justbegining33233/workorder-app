import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';

// GET /api/payroll/pay-periods/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = auth.role === 'shop' ? auth.id : (auth as any).shopId;
  if (!shopId) return NextResponse.json({ error: 'No shop context' }, { status: 400 });

  const { id } = await params;
  const period = await prisma.payPeriod.findFirst({
    where: { id, shopId },
    include: {
      payStubs: {
        include: {
          tech: { select: { id: true, firstName: true, lastName: true, jobTitle: true, department: true } },
        },
      },
    },
  });

  if (!period) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(period);
}

// PUT /api/payroll/pay-periods/[id] - update status or run payroll
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = auth.role === 'shop' ? auth.id : (auth as any).shopId;
  if (!shopId) return NextResponse.json({ error: 'No shop context' }, { status: 400 });
  if (auth.role !== 'shop') return NextResponse.json({ error: 'Shop owner only' }, { status: 403 });

  const { id } = await params;
  const body = await req.json();

  // If action = 'run', compute payroll for all employees
  if (body.action === 'run') {
    return await runPayroll(id, shopId, auth.id);
  }

  const period = await prisma.payPeriod.update({
    where: { id, shopId },
    data: {
      ...(body.status && { status: body.status }),
      ...(body.payDate && { payDate: new Date(body.payDate) }),
      ...(body.notes !== undefined && { notes: body.notes }),
      ...(body.status === 'paid' && {
        processedAt: new Date(),
        processedBy: auth.id,
      }),
    },
  });

  return NextResponse.json(period);
}

// DELETE /api/payroll/pay-periods/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = auth.role === 'shop' ? auth.id : (auth as any).shopId;
  if (!shopId) return NextResponse.json({ error: 'No shop context' }, { status: 400 });
  if (auth.role !== 'shop') return NextResponse.json({ error: 'Shop owner only' }, { status: 403 });

  const { id } = await params;
  await prisma.payPeriod.delete({ where: { id, shopId } });
  return NextResponse.json({ ok: true });
}

// ─── Payroll computation engine ─────────────────────────────────────────────
async function runPayroll(periodId: string, shopId: string, processedById: string) {
  const period = await prisma.payPeriod.findFirst({ where: { id: periodId, shopId } });
  if (!period) return NextResponse.json({ error: 'Period not found' }, { status: 404 });
  if (period.status === 'locked' || period.status === 'paid') {
    return NextResponse.json({ error: 'Period is already locked or paid' }, { status: 409 });
  }

  // Get overtime rules
  const otRule = await prisma.overtimeRule.findUnique({ where: { shopId } });
  const weeklyOTThreshold = otRule?.weeklyOvertimeThreshold ?? 40;
  const dailyOTEnabled = otRule?.dailyOvertimeEnabled ?? false;
  const dailyOTThreshold = otRule?.dailyOvertimeThreshold ?? 8;
  const otMultiplier = otRule?.overtimeMultiplier ?? 1.5;
  const doubleTimeEnabled = otRule?.doubleTimeEnabled ?? false;
  const doubleTimeThreshold = otRule?.doubleTimeThreshold ?? 12;
  const doubleMultiplier = otRule?.doubleTimeMultiplier ?? 2.0;

  // Get all techs in this shop
  const techs = await prisma.tech.findMany({
    where: { shopId, terminatedAt: null },
  });

  // Get all approved time entries in the period
  const timeEntries = await prisma.timeEntry.findMany({
    where: {
      shopId,
      clockIn: { gte: period.startDate, lte: period.endDate },
      clockOut: { not: null },
    },
    orderBy: { clockIn: 'asc' },
  });

  // Get approved PTO leave requests overlapping with this period
  const leaves = await prisma.leaveRequest.findMany({
    where: {
      shopId,
      status: 'approved',
      leaveType: { in: ['pto', 'vacation', 'sick'] },
      startDate: { lte: period.endDate },
      endDate: { gte: period.startDate },
    },
  });

  // Get YTD data for each tech (all paid periods this calendar year before this one)
  const yearStart = new Date(period.startDate.getFullYear(), 0, 1);
  const ytdStubs = await prisma.payStub.findMany({
    where: {
      shopId,
      status: { in: ['approved', 'paid'] },
      payPeriod: { startDate: { gte: yearStart, lt: period.startDate } },
    },
  });

  const payStubs = [];
  let totalGross = 0;
  let totalNet = 0;
  let totalTaxes = 0;
  const totalDeductions = 0;
  let totalOvertimePay = 0;

  for (const tech of techs) {
    const techEntries = timeEntries.filter((e) => e.techId === tech.id);
    const techLeaves = leaves.filter((l) => l.techId === tech.id);

    // Group entries by day for daily OT calculation
    const byDay: Record<string, number> = {};
    for (const entry of techEntries) {
      const day = entry.clockIn.toISOString().split('T')[0];
      byDay[day] = (byDay[day] ?? 0) + (entry.hoursWorked ?? 0);
    }

    let regularHours = 0;
    let overtimeHours = 0;
    let doubleTimeHours = 0;

    if (dailyOTEnabled) {
      // Calculate OT on daily basis first
      for (const day of Object.keys(byDay)) {
        const dayHours = byDay[day];
        if (doubleTimeEnabled && dayHours > doubleTimeThreshold) {
          doubleTimeHours += dayHours - doubleTimeThreshold;
          overtimeHours += doubleTimeThreshold - dailyOTThreshold;
          regularHours += dailyOTThreshold;
        } else if (dayHours > dailyOTThreshold) {
          overtimeHours += dayHours - dailyOTThreshold;
          regularHours += dailyOTThreshold;
        } else {
          regularHours += dayHours;
        }
      }
    } else {
      // Weekly overtime only
      const totalHours = Object.values(byDay).reduce((a, b) => a + b, 0);
      if (doubleTimeEnabled && totalHours > doubleTimeThreshold) {
        doubleTimeHours = totalHours - doubleTimeThreshold;
        overtimeHours = doubleTimeThreshold - weeklyOTThreshold;
        regularHours = weeklyOTThreshold;
      } else if (totalHours > weeklyOTThreshold) {
        overtimeHours = totalHours - weeklyOTThreshold;
        regularHours = weeklyOTThreshold;
      } else {
        regularHours = totalHours;
      }
    }

    // PTO/Sick hours
    let ptoHours = 0;
    let sickHours = 0;
    for (const leave of techLeaves) {
      if (leave.leaveType === 'sick') sickHours += leave.totalHours;
      else ptoHours += leave.totalHours;
    }

    // Pay calculation
    const hourlyRate = tech.payType === 'salary'
      ? (tech.salary ?? 0) / 2080 // annual to hourly
      : tech.hourlyRate;
    const overtimeRate = tech.overtimeRate ?? hourlyRate * otMultiplier;
    const doubleRate = hourlyRate * doubleMultiplier;

    const regularPay = regularHours * hourlyRate;
    const overtimePay = overtimeHours * overtimeRate;
    const doubleTimePay = doubleTimeHours * doubleRate;
    const ptoPay = (ptoHours + sickHours) * hourlyRate;
    const grossPay = regularPay + overtimePay + doubleTimePay + ptoPay;

    // Tax calculations (simplified US estimates)
    const ytdGrossBefore = ytdStubs
      .filter((s) => s.techId === tech.id)
      .reduce((sum, s) => sum + s.grossPay, 0);

    // Social Security: 6.2% up to $168,600 wage base
    const ssWageBase = 168600;
    const ssApplicable = Math.max(0, Math.min(grossPay, ssWageBase - ytdGrossBefore));
    const socialSecurity = ssApplicable * 0.062;
    const medicare = grossPay * 0.0145;

    // Federal withholding estimate (simplified - 22% bracket)
    const federalTax = grossPay * 0.22;
    // State tax estimate (5% default)
    const stateTax = grossPay * 0.05;

    const totalTaxesForStub = federalTax + stateTax + socialSecurity + medicare;
    const netPay = grossPay - totalTaxesForStub;

    // YTD totals
    const ytdGross = ytdGrossBefore + grossPay;
    const ytdTaxesPrev = ytdStubs
      .filter((s) => s.techId === tech.id)
      .reduce((sum, s) => sum + s.federalTax + s.stateTax + s.socialSecurity + s.medicare, 0);
    const ytdTaxes = ytdTaxesPrev + totalTaxesForStub;
    const ytdNet = ytdGross - ytdTaxes;

    totalGross += grossPay;
    totalNet += netPay;
    totalTaxes += totalTaxesForStub;
    totalOvertimePay += overtimePay + doubleTimePay;

    // Upsert pay stub (allow re-running)
    const existingStub = await prisma.payStub.findFirst({
      where: { payPeriodId: periodId, techId: tech.id },
    });

    const stubData = {
      shopId,
      techId: tech.id,
      payPeriodId: periodId,
      regularHours,
      overtimeHours,
      doubleTimeHours,
      ptoHours,
      sickHours,
      regularPay,
      overtimePay,
      doubleTimePay,
      ptoPay,
      grossPay,
      federalTax,
      stateTax,
      socialSecurity,
      medicare,
      totalDeductions: totalTaxesForStub,
      netPay,
      ytdGross,
      ytdTaxes,
      ytdNet,
      status: 'draft' as const,
    };

    const stub = existingStub
      ? await prisma.payStub.update({ where: { id: existingStub.id }, data: stubData })
      : await prisma.payStub.create({ data: stubData });

    payStubs.push(stub);
  }

  // Update pay period totals
  const updatedPeriod = await prisma.payPeriod.update({
    where: { id: periodId },
    data: {
      status: 'processing',
      totalGross,
      totalNet,
      totalTaxes,
      totalDeductions,
      totalOvertimePay,
      employeeCount: payStubs.length,
      processedAt: new Date(),
      processedBy: processedById,
    },
  });

  return NextResponse.json({ period: updatedPeriod, payStubs, summary: { totalGross, totalNet, totalTaxes, totalOvertimePay, employeeCount: payStubs.length } });
}
