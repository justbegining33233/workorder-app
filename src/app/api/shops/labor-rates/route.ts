import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateCsrf } from '@/lib/csrf';
import { z } from 'zod';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shopId');

    if (!shopId) {
      return NextResponse.json({ error: 'Shop ID is required' }, { status: 400 });
    }

    const laborRates = await prisma.shopLaborRate.findMany({
      where: { shopId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(laborRates);
  } catch (error) {
    console.error('Error fetching labor rates:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!request.headers.get('authorization')) {
      const ok = await validateCsrf(request);
      if (!ok) return NextResponse.json({ error: 'CSRF validation failed' }, { status: 403 });
    }
    const body = await request.json();
    const schema = z.object({
      shopId: z.string().min(1),
      name: z.string().min(1),
      rate: z.union([z.string(), z.number()]),
      category: z.string().min(1),
    });

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }

    const { shopId, name, rate, category } = parsed.data;
    const numericRate = typeof rate === 'number' ? rate : parseFloat(rate);
    if (!Number.isFinite(numericRate)) {
      return NextResponse.json({ error: 'Invalid rate value' }, { status: 400 });
    }

    const laborRate = await prisma.shopLaborRate.create({
      data: {
        shopId,
        name,
        rate: numericRate,
        category,
      },
    });

    return NextResponse.json(laborRate, { status: 201 });
  } catch (error) {
    console.error('Error creating labor rate:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!request.headers.get('authorization')) {
      const ok = await validateCsrf(request);
      if (!ok) return NextResponse.json({ error: 'CSRF validation failed' }, { status: 403 });
    }
    const body = await request.json();
    const schema = z.object({
      id: z.string().min(1),
      name: z.string().min(1),
      rate: z.union([z.string(), z.number()]),
      category: z.string().min(1),
    });

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }

    const { id, name, rate, category } = parsed.data;
    const numericRate = typeof rate === 'number' ? rate : parseFloat(rate);
    if (!Number.isFinite(numericRate)) {
      return NextResponse.json({ error: 'Invalid rate value' }, { status: 400 });
    }

    const laborRate = await prisma.shopLaborRate.update({
      where: { id },
      data: {
        name,
        rate: numericRate,
        category,
      },
    });

    return NextResponse.json(laborRate);
  } catch (error) {
    console.error('Error updating labor rate:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!request.headers.get('authorization')) {
      const ok = await validateCsrf(request);
      if (!ok) return NextResponse.json({ error: 'CSRF validation failed' }, { status: 403 });
    }
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Labor rate ID is required' }, { status: 400 });
    }

    await prisma.shopLaborRate.delete({ where: { id } });

    return NextResponse.json({ message: 'Labor rate deleted successfully' });
  } catch (error) {
    console.error('Error deleting labor rate:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}