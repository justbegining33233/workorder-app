import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { is2FAEnabled } from '@/lib/two-factor';

// GET /api/auth/2fa/status — Return 2FA status for authenticated user
export async function GET(request: NextRequest) {
  const auth = requireRole(request, ['shop', 'tech', 'manager']);
  if (auth instanceof NextResponse) return auth;

  return NextResponse.json({
    enabled: is2FAEnabled(auth.id),
    userId: auth.id,
    role: auth.role,
  });
}
