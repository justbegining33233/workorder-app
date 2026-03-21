import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const auth = authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = auth.role === 'shop' ? auth.id : (auth as any).shopId;
  if (!shopId) return NextResponse.json({ error: 'No shop' }, { status: 400 });

  try {
    const bays = await prisma.bay.findMany({ where: { shopId }, orderBy: { name: 'asc' } });
    return NextResponse.json(bays);
  } catch (error) {
    console.error('Error fetching bays:', error);
    return NextResponse.json({ error: 'Failed to fetch bays' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = auth.role === 'shop' ? auth.id : (auth as any).shopId;
  if (!shopId) return NextResponse.json({ error: 'No shop' }, { status: 400 });

  try {
    const body = await req.json();
    const bay = await prisma.bay.create({
      data: { shopId, name: body.name, type: body.type || 'general', status: 'empty' },
    });
    return NextResponse.json(bay, { status: 201 });
  } catch (error) {
    console.error('Error creating bay:', error);
    return NextResponse.json({ error: 'Failed to create bay' }, { status: 500 });
  }
}
