import { NextResponse } from 'next/server';

// In-memory storage for activity logs
const activityLogs: {
  id: string;
  type: string;
  action: string;
  details: string;
  time: Date;
  severity: string;
  user: string;
  location?: string;
  email?: string;
  amount?: string;
  reason?: string;
}[] = [];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const severity = searchParams.get('severity');
    const limit = searchParams.get('limit');

    let filteredLogs = [...activityLogs];

    // Filter by type
    if (type && type !== 'all') {
      filteredLogs = filteredLogs.filter(log => log.type === type);
    }

    // Filter by severity
    if (severity && severity !== 'all') {
      filteredLogs = filteredLogs.filter(log => log.severity === severity);
    }

    // Sort by time (most recent first)
    filteredLogs.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    // Apply limit
    if (limit) {
      filteredLogs = filteredLogs.slice(0, parseInt(limit));
    }

    return NextResponse.json(filteredLogs);
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch activity logs' },
      { status: 500 }
    );
  }
}
