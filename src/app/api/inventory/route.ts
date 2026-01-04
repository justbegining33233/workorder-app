import { NextRequest, NextResponse } from 'next/server';
import { addLaborRate, addPart, deleteLaborRate, deletePart, getInventory, updateLaborRate, updatePart } from '@/lib/inventory';
import { requireAuth } from '@/lib/middleware';
import { validateCsrf } from '@/lib/csrf';

export async function GET() {
  try {
    return NextResponse.json(getInventory());
  } catch (e) {
    console.error('Failed to load inventory', e);
    return NextResponse.json({ error: 'Failed to load inventory' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  try {
    if (!req.headers.get('authorization')) {
      const ok = await validateCsrf(req);
      if (!ok) return NextResponse.json({ error: 'CSRF validation failed' }, { status: 403 });
    }
    const body = await req.json();
    if (body.type === 'part') {
      const part = addPart({
        name: body.name,
        sku: body.sku,
        quantity: Number(body.quantity) || 0,
        price: Number(body.price) || 0,
      });
      return NextResponse.json(part, { status: 201 });
    }
    if (body.type === 'labor') {
      const rate = addLaborRate({
        name: body.name,
        rate: Number(body.rate) || 0,
      });
      return NextResponse.json(rate, { status: 201 });
    }
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (e) {
    console.error('Failed to create inventory item', e);
    return NextResponse.json({ error: 'Failed to create inventory item' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  try {
    if (!req.headers.get('authorization')) {
      const ok = await validateCsrf(req);
      if (!ok) return NextResponse.json({ error: 'CSRF validation failed' }, { status: 403 });
    }
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');
    if (!type || !id) return NextResponse.json({ error: 'Missing type or id' }, { status: 400 });

    if (type === 'part') deletePart(id);
    else if (type === 'labor') deleteLaborRate(id);
    else return NextResponse.json({ error: 'Invalid type' }, { status: 400 });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Failed to delete inventory item', e);
    return NextResponse.json({ error: 'Failed to delete inventory item' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  try {
    if (!req.headers.get('authorization')) {
      const ok = await validateCsrf(req);
      if (!ok) return NextResponse.json({ error: 'CSRF validation failed' }, { status: 403 });
    }
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');
    const body = await req.json();

    if (!type || !id) return NextResponse.json({ error: 'Missing type or id' }, { status: 400 });

    if (type === 'part') {
      const part = updatePart(id, {
        name: body.name,
        sku: body.sku,
        quantity: Number(body.quantity) || 0,
        price: Number(body.price) || 0,
      });
      if (!part) return NextResponse.json({ error: 'Part not found' }, { status: 404 });
      return NextResponse.json(part);
    }
    if (type === 'labor') {
      const rate = updateLaborRate(id, {
        name: body.name,
        rate: Number(body.rate) || 0,
      });
      if (!rate) return NextResponse.json({ error: 'Labor rate not found' }, { status: 404 });
      return NextResponse.json(rate);
    }
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (e) {
    console.error('Failed to update inventory item', e);
    return NextResponse.json({ error: 'Failed to update inventory item' }, { status: 500 });
  }
}
