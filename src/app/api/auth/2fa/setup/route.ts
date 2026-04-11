/**
 * POST /api/auth/2fa/setup
 * Generates a TOTP secret + QR code for the authenticated shop.
 * 2FA is NOT yet active — the shop must call /api/auth/2fa/verify to confirm.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { generateTotpSecret, encryptSecret } from '@/lib/two-factor';
import QRCode from 'qrcode';

export async function POST(request: NextRequest) {
  const auth = requireRole(request, ['shop']);
  if (auth instanceof NextResponse) return auth;

  try {
    const prisma = (await import('@/lib/prisma')).default;
    const shop = await prisma.shop.findUnique({ where: { id: auth.id } });
    if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

    const { base32, otpauthUrl } = generateTotpSecret(shop.email);

    // Save encrypted secret (not enabled yet — confirmed in /verify)
    await prisma.shop.update({
      where: { id: auth.id },
      data: { twoFactorSecret: encryptSecret(base32), twoFactorEnabled: false },
    });

    const qrCode = await QRCode.toDataURL(otpauthUrl);

    return NextResponse.json({ secret: base32, qrCode, otpauthUrl });
  } catch (error) {
    console.error('2FA setup error:', error);
    return NextResponse.json({ error: 'Failed to set up 2FA' }, { status: 500 });
  }
}
