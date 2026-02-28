import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import crypto from 'crypto';

export async function GET(req: NextRequest) {
  const auth = authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = auth.role === 'shop' ? auth.id : (auth as any).shopId;
  if (!shopId) return NextResponse.json({ error: 'No shop' }, { status: 400 });
  const list = await prisma.workAuthorization.findMany({ where: { shopId }, orderBy: { createdAt: 'desc' } });
  return NextResponse.json(list);
}

export async function POST(req: NextRequest) {
  const auth = authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = auth.role === 'shop' ? auth.id : (auth as any).shopId;
  if (!shopId) return NextResponse.json({ error: 'No shop' }, { status: 400 });

  const body = await req.json();
  const token = crypto.randomBytes(24).toString('hex');
  const expiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  const wa = await prisma.workAuthorization.create({
    data: {
      shopId,
      workOrderId: body.workOrderId || '',
      customerId: body.customerId || null,
      authToken: token,
      estimateTotal: body.estimateTotal ? Number(body.estimateTotal) : null,
      workSummary: body.workSummary,
      expiresAt: expiry,
      status: 'pending',
      notes: body.notes,
    },
  });
  return NextResponse.json({ ...wa, link: `/customer/authorization/${token}` }, { status: 201 });
}
