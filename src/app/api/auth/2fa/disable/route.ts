import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { disable2FA, is2FAEnabled } from '@/lib/two-factor';

// POST /api/auth/2fa/disable — Disable 2FA for the authenticated user
export async function POST(request: NextRequest) {
  const auth = requireRole(request, ['shop', 'tech', 'manager']);
  if (auth instanceof NextResponse) return auth;

  const userId = auth.id;

  if (!is2FAEnabled(userId)) {
    return NextResponse.json({ message: '2FA is not currently enabled', enabled: false });
  }

  disable2FA(userId);

  return NextResponse.json({
    message: '2FA disabled successfully',
    enabled: false,
    userId,
  });
}
