import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const auth = authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = auth.role === 'shop' ? auth.id : (auth as any).shopId;
  if (!shopId) return NextResponse.json({ error: 'No shop' }, { status: 400 });
  const fees = await prisma.environmentalFee.findMany({ where: { shopId }, orderBy: { name: 'asc' } });
  return NextResponse.json(fees);
}
export async function POST(req: NextRequest) {
  const auth = authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = auth.role === 'shop' ? auth.id : (auth as any).shopId;
  if (!shopId) return NextResponse.json({ error: 'No shop' }, { status: 400 });
  const body = await req.json();
  const fee = await prisma.environmentalFee.create({
    data: { shopId, name: body.name, feeAmount: Number(body.feeAmount) || 0, unit: body.unit || 'per_job', taxable: Boolean(body.taxable), active: body.active !== false },
  });
  return NextResponse.json(fee, { status: 201 });
}
