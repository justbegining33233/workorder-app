/**
 * POST /api/auth/2fa/verify
 * Verifies a TOTP token against the pending secret and enables 2FA.
 * 
 * GET /api/auth/2fa/verify
 * Returns current 2FA status from the DB.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { verifyTotpToken } from '@/lib/two-factor';

export async function POST(request: NextRequest) {
  const auth = requireRole(request, ['shop']);
  if (auth instanceof NextResponse) return auth;

  const body = await request.json().catch(() => null);
  if (!body?.token) {
    return NextResponse.json({ error: 'token is required' }, { status: 400 });
  }

  try {
    const prisma = (await import('@/lib/prisma')).default;
    const shop = await prisma.shop.findUnique({ where: { id: auth.id } });
    if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

    if (!shop.twoFactorSecret) {
      return NextResponse.json({ error: 'Run /api/auth/2fa/setup first' }, { status: 400 });
    }

    const valid = verifyTotpToken(shop.twoFactorSecret, String(body.token));
    if (!valid) {
      return NextResponse.json({ error: 'Invalid TOTP token' }, { status: 400 });
    }

    await prisma.shop.update({ where: { id: auth.id }, data: { twoFactorEnabled: true } });

    return NextResponse.json({ message: '2FA enabled successfully', enabled: true });
  } catch (error) {
    console.error('2FA verify error:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const auth = requireRole(request, ['shop']);
  if (auth instanceof NextResponse) return auth;

  const prisma = (await import('@/lib/prisma')).default;
  const shop = await prisma.shop.findUnique({
    where: { id: auth.id },
    select: { twoFactorEnabled: true },
  });

  return NextResponse.json({ enabled: shop?.twoFactorEnabled ?? false });
}
