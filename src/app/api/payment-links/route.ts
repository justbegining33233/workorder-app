import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import crypto from 'crypto';

export async function GET(req: NextRequest) {
  const auth = authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = auth.role === 'shop' ? auth.id : (auth as any).shopId;
  if (!shopId) return NextResponse.json({ error: 'No shop' }, { status: 400 });
  const links = await prisma.paymentLink.findMany({ where: { shopId }, orderBy: { createdAt: 'desc' } });
  return NextResponse.json(links);
}

export async function POST(req: NextRequest) {
  const auth = authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = auth.role === 'shop' ? auth.id : (auth as any).shopId;
  if (!shopId) return NextResponse.json({ error: 'No shop' }, { status: 400 });
  const body = await req.json();
  const token = crypto.randomBytes(24).toString('hex');
  const link = await prisma.paymentLink.create({
    data: {
      shopId,
      token,
      amount: Number(body.amount),
      description: body.description,
      workOrderId: body.workOrderId || null,
      customerId: body.customerId || null,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: 'pending',
    },
  });
  return NextResponse.json({ ...link, link: `/customer/pay/${token}` }, { status: 201 });
}
