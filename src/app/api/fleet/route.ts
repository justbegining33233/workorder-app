import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const auth = authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = auth.role === 'shop' ? auth.id : (auth as any).shopId;
  if (!shopId) return NextResponse.json({ error: 'No shop' }, { status: 400 });

  const accounts = await prisma.fleetAccount.findMany({
    where: { shopId },
    include: { vehicles: true, invoices: { orderBy: { createdAt: 'desc' }, take: 5 } },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(accounts);
}

export async function POST(req: NextRequest) {
  const auth = authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = auth.role === 'shop' ? auth.id : (auth as any).shopId;
  if (!shopId) return NextResponse.json({ error: 'No shop' }, { status: 400 });

  const body = await req.json();
  const account = await prisma.fleetAccount.create({
    data: {
      shopId,
      companyName: body.companyName,
      contactName: body.contactName,
      contactEmail: body.contactEmail,
      contactPhone: body.contactPhone,
      billingAddress: body.billingAddress,
      taxId: body.taxId,
      netTerms: Number(body.netTerms) || 30,
      creditLimit: Number(body.creditLimit) || 0,
      notes: body.notes,
    },
  });
  return NextResponse.json(account, { status: 201 });
}
