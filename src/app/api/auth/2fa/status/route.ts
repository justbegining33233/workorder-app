/**
 * GET /api/auth/2fa/status
 * Returns 2FA enabled status for the authenticated shop from the DB.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const auth = requireRole(request, ['shop']);
  if (auth instanceof NextResponse) return auth;

  const prisma = (await import('@/lib/prisma')).default;
  const shop = await prisma.shop.findUnique({
    where: { id: auth.id },
    select: { twoFactorEnabled: true },
  });

  return NextResponse.json({
    enabled: shop?.twoFactorEnabled ?? false,
    userId: auth.id,
    role: auth.role,
  });
}
