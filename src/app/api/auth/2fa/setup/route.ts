import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { generateOTP, is2FAEnabled } from '@/lib/two-factor';

// POST /api/auth/2fa/setup — Generate an OTP and initiate 2FA setup
export async function POST(request: NextRequest) {
  const auth = requireRole(request, ['shop', 'tech', 'manager']);
  if (auth instanceof NextResponse) return auth;

  const userId = auth.id;
  const code = generateOTP(userId);

  // In production: send code via email/SMS
  // For demo: return the code directly so it can be tested

  return NextResponse.json({
    message: '2FA setup initiated. Enter the code to confirm.',
    // NOTE: In production, code is sent by email/SMS — remove from response
    code, // demo only
    userId,
    alreadyEnabled: is2FAEnabled(userId),
  });
}
