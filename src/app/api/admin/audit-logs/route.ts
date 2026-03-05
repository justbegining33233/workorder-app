import { NextRequest, NextResponse } from 'next/server';
import { getAuditLogs } from '@/lib/auditLog';
import { requireRole } from '@/lib/auth';

export async function GET(request: NextRequest) {
  // Require admin authentication
  const auth = requireRole(request, ['admin', 'superadmin']);
  if (auth instanceof NextResponse) return auth;

  return NextResponse.json(getAuditLogs());
}
