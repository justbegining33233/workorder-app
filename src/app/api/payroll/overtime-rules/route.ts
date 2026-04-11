import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';

// GET /api/payroll/overtime-rules
export async function GET(req: NextRequest) {
  const auth = authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = auth.role === 'shop' ? auth.id : (auth as any).shopId;
  if (!shopId) return NextResponse.json({ error: 'No shop context' }, { status: 400 });

  const rule = await prisma.overtimeRule.findUnique({ where: { shopId } });
  return NextResponse.json(rule ?? {
    shopId,
    weeklyOvertimeEnabled: true,
    weeklyOvertimeThreshold: 40,
    overtimeMultiplier: 1.5,
    dailyOvertimeEnabled: false,
    dailyOvertimeThreshold: 8,
    dailyOTMultiplier: 1.5,
    doubleTimeEnabled: false,
    doubleTimeThreshold: 12,
    doubleTimeMultiplier: 2.0,
    seventhDayRule: false,
  });
}

// PUT /api/payroll/overtime-rules - upsert
export async function PUT(req: NextRequest) {
  const auth = authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = auth.role === 'shop' ? auth.id : (auth as any).shopId;
  if (!shopId) return NextResponse.json({ error: 'No shop context' }, { status: 400 });
  if (auth.role !== 'shop') return NextResponse.json({ error: 'Shop owner only' }, { status: 403 });

  const body = await req.json();

  const rule = await prisma.overtimeRule.upsert({
    where: { shopId },
    create: { shopId, ...body },
    update: body,
  });

  return NextResponse.json(rule);
}
