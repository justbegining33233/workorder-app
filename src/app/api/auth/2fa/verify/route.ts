import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { verifyOTP, enable2FA, is2FAEnabled } from '@/lib/two-factor';

// POST /api/auth/2fa/verify — Verify OTP and enable 2FA
export async function POST(request: NextRequest) {
  const auth = requireRole(request, ['shop', 'tech', 'manager']);
  if (auth instanceof NextResponse) return auth;

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const { code } = body as Record<string, unknown>;

  if (!code) {
    return NextResponse.json({ error: 'Code is required' }, { status: 400 });
  }

  const userId = auth.id;
  const valid = verifyOTP(userId, String(code).trim());

  if (!valid) {
    return NextResponse.json({ error: 'Invalid or expired code' }, { status: 400 });
  }

  enable2FA(userId);

  return NextResponse.json({
    message: '2FA enabled successfully',
    enabled: true,
    userId,
  });
}

// GET /api/auth/2fa/verify — Check if 2FA is currently enabled
export async function GET(request: NextRequest) {
  const auth = requireRole(request, ['shop', 'tech', 'manager']);
  if (auth instanceof NextResponse) return auth;

  return NextResponse.json({
    enabled: is2FAEnabled(auth.id),
    userId: auth.id,
  });
}
