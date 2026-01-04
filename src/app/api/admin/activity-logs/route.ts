import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const filterType = searchParams.get('type');
    const filterSeverity = searchParams.get('severity');

    // Fetch audit logs from database
    const auditLogs = await prisma.auditLog.findMany({
      take: 100, // Limit to 100 most recent logs
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform audit logs to activity logs format
    const activityLogs = auditLogs.map((log: {
      id: string;
      action: string;
      details: any;
      createdAt: Date;
      adminId: string;
    }) => {
      let type: 'shop' | 'revenue' | 'user' | 'alert' = 'user';
      let severity: 'info' | 'success' | 'warning' | 'error' = 'info';

      // Determine type based on action
      if (log.action.includes('shop') || log.action.includes('Shop')) {
        type = 'shop';
      } else if (log.action.includes('payment') || log.action.includes('invoice')) {
        type = 'revenue';
      } else if (log.action.includes('failed') || log.action.includes('error')) {
        type = 'alert';
        severity = 'error';
      } else if (log.action.includes('created') || log.action.includes('approved')) {
        severity = 'success';
      } else if (log.action.includes('deleted') || log.action.includes('denied')) {
        severity = 'warning';
      }

      return {
        id: log.id,
        type,
        action: log.action,
        details: typeof log.details === 'string' ? log.details : JSON.stringify(log.details || {}),
        time: log.createdAt,
        severity,
        user: log.adminId || 'System',
        email: undefined,
        location: undefined,
      };
    });

    // Apply filters
    let filteredLogs = activityLogs;
    if (filterType && filterType !== 'all') {
      filteredLogs = filteredLogs.filter((log: { type: string }) => log.type === filterType);
    }
    if (filterSeverity && filterSeverity !== 'all') {
      filteredLogs = filteredLogs.filter((log: { severity: string }) => log.severity === filterSeverity);
    }

    return NextResponse.json(filteredLogs);
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
