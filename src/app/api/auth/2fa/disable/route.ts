/**
 * POST /api/auth/2fa/disable
 * Verifies the current TOTP token then disables 2FA and clears the secret.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { verifyTotpToken, decryptSecret } from '@/lib/two-factor';

export async function POST(request: NextRequest) {
  const auth = requireRole(request, ['shop']);
  if (auth instanceof NextResponse) return auth;

  const body = await request.json().catch(() => null);
  if (!body?.token) {
    return NextResponse.json({ error: 'Provide your current TOTP token to disable 2FA' }, { status: 400 });
  }

  try {
    const prisma = (await import('@/lib/prisma')).default;
    const shop = await prisma.shop.findUnique({ where: { id: auth.id } });
    if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

    if (!shop.twoFactorEnabled || !shop.twoFactorSecret) {
      return NextResponse.json({ message: '2FA is not currently enabled', enabled: false });
    }

    const valid = verifyTotpToken(decryptSecret(shop.twoFactorSecret), String(body.token));
    if (!valid) {
      return NextResponse.json({ error: 'Invalid TOTP token' }, { status: 400 });
    }

    await prisma.shop.update({
      where: { id: auth.id },
      data: { twoFactorEnabled: false, twoFactorSecret: null },
    });

    return NextResponse.json({ message: '2FA disabled successfully', enabled: false });
  } catch (error) {
    console.error('2FA disable error:', error);
    return NextResponse.json({ error: 'Failed to disable 2FA' }, { status: 500 });
  }
}
