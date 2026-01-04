import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// Helper to get week key (year-week format)
function getWeekKey(date: Date): string {
  const year = date.getFullYear();
  const weekNum = getWeekNumber(date);
  return `${year}-W${weekNum}`;
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

// GET - Generate payroll report
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
    const shopId = searchParams.get('shopId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const format = searchParams.get('format') || 'json'; // json, csv

    if (!shopId) {
      return NextResponse.json({ error: 'Shop ID required' }, { status: 400 });
    }

    // Verify user has access to this shop
    if (decoded.role === 'shop') {
      // For shop owners, verify they own this shop
      if (decoded.id !== shopId) {
        return NextResponse.json({ error: 'Access denied to this shop' }, { status: 403 });
      }
    } else if (decoded.role === 'manager') {
      // For managers, verify they belong to this shop
      const manager = await prisma.tech.findFirst({
        where: {
          id: decoded.id,
          shopId: shopId,
          role: 'manager',
        },
      });
      
      if (!manager) {
        return NextResponse.json({ error: 'Access denied to this shop' }, { status: 403 });
      }
    } else {
      // Reject any other roles (techs shouldn't see payroll)
      return NextResponse.json({ error: 'Unauthorized - Shop admin or manager only' }, { status: 403 });
    }

    // Default to current pay period (2 weeks)
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    // Get all time entries for the shop in the date range
    const timeEntries = await prisma.timeEntry.findMany({
      where: {
        shopId,
        clockIn: {
          gte: start,
          lte: end,
        },
        clockOut: { not: null }, // Only completed entries
      },
      include: {
        tech: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            hourlyRate: true,
          },
        },
      },
      orderBy: { clockIn: 'asc' },
    });

    // Group by employee
    const employeeHours: Record<string, any> = {};

    timeEntries.forEach((entry) => {
      const empId = entry.techId;
      
      if (!employeeHours[empId]) {
        employeeHours[empId] = {
          id: entry.tech.id,
          name: `${entry.tech.firstName} ${entry.tech.lastName}`,
          email: entry.tech.email,
          role: entry.tech.role,
          hourlyRate: entry.tech.hourlyRate,
          totalHours: 0,
          regularHours: 0,
          overtimeHours: 0,
          totalPay: 0,
          regularPay: 0,
          overtimePay: 0,
          entries: [],
          weeklyHours: {}, // Track hours by week for overtime calc
        };
      }

      const weekKey = getWeekKey(entry.clockIn);
      if (!employeeHours[empId].weeklyHours[weekKey]) {
        employeeHours[empId].weeklyHours[weekKey] = 0;
      }

      employeeHours[empId].totalHours += entry.hoursWorked || 0;
      employeeHours[empId].weeklyHours[weekKey] += entry.hoursWorked || 0;
      
      employeeHours[empId].entries.push({
        date: entry.clockIn.toISOString().split('T')[0],
        clockIn: entry.clockIn.toLocaleTimeString(),
        clockOut: entry.clockOut?.toLocaleTimeString(),
        hours: entry.hoursWorked,
        notes: entry.notes,
      });
    });

    // Get shop settings for overtime multiplier
    const shopSettings = await prisma.shopSettings.findFirst({
      where: { shopId },
    });
    const overtimeMultiplier = shopSettings?.overtimeMultiplier || 1.5;

    // Calculate overtime pay (over 40 hours per week)
    Object.values(employeeHours).forEach((emp: any) => {
      let regularTotal = 0;
      let overtimeTotal = 0;

      Object.values(emp.weeklyHours).forEach((weekHours: any) => {
        if (weekHours <= 40) {
          regularTotal += weekHours;
        } else {
          regularTotal += 40;
          overtimeTotal += weekHours - 40;
        }
      });

      emp.regularHours = regularTotal;
      emp.overtimeHours = overtimeTotal;
      emp.regularPay = regularTotal * emp.hourlyRate;
      emp.overtimePay = overtimeTotal * emp.hourlyRate * overtimeMultiplier;
      emp.totalPay = emp.regularPay + emp.overtimePay;

      delete emp.weeklyHours; // Remove temporary tracking
    });

    const report = {
      shopId,
      periodStart: start.toISOString().split('T')[0],
      periodEnd: end.toISOString().split('T')[0],
      generatedAt: new Date().toISOString(),
      employees: Object.values(employeeHours),
      summary: {
        totalEmployees: Object.keys(employeeHours).length,
        totalHours: Object.values(employeeHours).reduce((sum: number, emp: any) => sum + emp.totalHours, 0),
        regularHours: Object.values(employeeHours).reduce((sum: number, emp: any) => sum + emp.regularHours, 0),
        overtimeHours: Object.values(employeeHours).reduce((sum: number, emp: any) => sum + emp.overtimeHours, 0),
        totalPayroll: Object.values(employeeHours).reduce((sum: number, emp: any) => sum + emp.totalPay, 0),
        overtimeMultiplier,
      },
    };

    if (format === 'csv') {
      // Generate CSV format with overtime breakdown
      let csv = 'Employee,Email,Role,Date,Clock In,Clock Out,Hours,Hourly Rate,Regular Hours,Overtime Hours,Regular Pay,Overtime Pay,Total Pay\n';
      
      Object.values(employeeHours).forEach((emp: any) => {
        emp.entries.forEach((entry: any, idx: number) => {
          csv += `${emp.name},${emp.email},${emp.role},${entry.date},${entry.clockIn},${entry.clockOut},${entry.hours},${emp.hourlyRate},`;
          if (idx === 0) {
            csv += `${emp.regularHours.toFixed(2)},${emp.overtimeHours.toFixed(2)},${emp.regularPay.toFixed(2)},${emp.overtimePay.toFixed(2)},${emp.totalPay.toFixed(2)}\n`;
          } else {
            csv += ',,,,\n';
          }
        });
      });

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename=payroll_${start.toISOString().split('T')[0]}_to_${end.toISOString().split('T')[0]}.csv`,
        },
      });
    }

    return NextResponse.json(report);
  } catch (error) {
    console.error('Error generating payroll report:', error);
    return NextResponse.json({ error: 'Failed to generate payroll report' }, { status: 500 });
  }
}
