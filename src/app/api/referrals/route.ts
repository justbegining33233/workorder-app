import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import crypto from 'crypto';

export async function GET(req: NextRequest) {
  const auth = authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = auth.role === 'shop' ? auth.id : (auth as any).shopId;
  if (!shopId) return NextResponse.json({ error: 'No shop' }, { status: 400 });
  const referrals = await prisma.referral.findMany({ where: { shopId }, orderBy: { createdAt: 'desc' } });
  return NextResponse.json(referrals);
}

export async function POST(req: NextRequest) {
  const auth = authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = auth.role === 'shop' ? auth.id : (auth as any).shopId;
  if (!shopId) return NextResponse.json({ error: 'No shop' }, { status: 400 });
  const body = await req.json();

  if (body._action === 'create_for_customer') {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    const referral = await prisma.referral.create({
      data: {
        shopId,
        referrerCustomerId: body.customerId,
        referralCode: code,
        referrerReward: Number(body.referrerReward) || 25,
        referredReward: Number(body.referredReward) || 25,
        status: 'pending',
      },
    });
    return NextResponse.json(referral, { status: 201 });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
