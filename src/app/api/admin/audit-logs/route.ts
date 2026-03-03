import { NextRequest, NextResponse } from 'next/server';
import { getAuditLogs } from '@/lib/auditLog';
import { requireRole } from '@/lib/auth';

export async function GET(request: NextRequest) {
  // Require admin authentication
  const auth = requireRole(request, ['admin', 'superadmin']);
  if (auth instanceof NextResponse) return auth;

  if (auth.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized - Admin access only' }, { status: 403 });
  }

  return NextResponse.json(getAuditLogs());
}
