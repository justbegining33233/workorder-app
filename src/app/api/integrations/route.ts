import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';

// GET/PATCH integrations for a shop
export async function GET(req: NextRequest) {
  const auth = authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = auth.role === 'shop' ? auth.id : (auth as any).shopId;
  if (!shopId) return NextResponse.json({ error: 'No shop' }, { status: 400 });
  const configs = await prisma.integrationConfig.findMany({ where: { shopId } });
  // Remove sensitive tokens from response
  return NextResponse.json(configs.map(c => ({ ...c, accessToken: c.accessToken ? '***' : null, refreshToken: null })));
}

export async function POST(req: NextRequest) {
  const auth = authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = auth.role === 'shop' ? auth.id : (auth as any).shopId;
  if (!shopId) return NextResponse.json({ error: 'No shop' }, { status: 400 });
  const body = await req.json();

  const config = await prisma.integrationConfig.upsert({
    where: { shopId_provider: { shopId, provider: body.provider } },
    update: { enabled: body.enabled, settings: body.settings, accountId: body.accountId },
    create: {
      shopId, provider: body.provider, enabled: body.enabled || false,
      settings: body.settings || null, accountId: body.accountId || null,
    },
  });
  return NextResponse.json({ ...config, accessToken: null, refreshToken: null }, { status: 201 });
}
