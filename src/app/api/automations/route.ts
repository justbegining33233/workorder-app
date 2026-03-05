import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const auth = authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = auth.role === 'shop' ? auth.id : (auth as any).shopId;
  if (!shopId) return NextResponse.json({ error: 'No shop' }, { status: 400 });
  try {
    const rules = await prisma.automationRule.findMany({ where: { shopId }, include: { executions: { orderBy: { sentAt: 'desc' }, take: 5 } }, orderBy: { createdAt: 'desc' } });
    return NextResponse.json(rules);
  } catch (error) {
    console.error('Error fetching automations:', error);
    return NextResponse.json({ error: 'Failed to fetch automations' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = auth.role === 'shop' ? auth.id : (auth as any).shopId;
  if (!shopId) return NextResponse.json({ error: 'No shop' }, { status: 400 });
  try {
    const body = await req.json();
    const rule = await prisma.automationRule.create({
      data: {
        shopId,
        name: body.name,
        type: body.type,
        trigger: body.trigger,
        triggerValue: Number(body.triggerValue) || 0,
        channel: body.channel || 'sms',
        messageTemplate: body.messageTemplate,
        active: body.active !== false,
      },
    });
    return NextResponse.json(rule, { status: 201 });
  } catch (error) {
    console.error('Error creating automation:', error);
    return NextResponse.json({ error: 'Failed to create automation' }, { status: 500 });
  }
}
