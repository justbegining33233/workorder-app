import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// POST - Add a blocked date
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded || !['shop', 'manager'].includes(decoded.role)) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const shopId = decoded.shopId || decoded.id;
    const body = await request.json();
    const { date, reason } = body;

    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }

    const blockedDate = await prisma.shopBlockedDate.create({
      data: {
        shopId,
        date: new Date(date),
        reason: reason || null
      }
    });

    return NextResponse.json(blockedDate);
  } catch (error: unknown) {
    console.error('Error adding blocked date:', error);
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json({ error: 'This date is already blocked' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to add blocked date' }, { status: 500 });
  }
}

// DELETE - Remove a blocked date
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded || !['shop', 'manager'].includes(decoded.role)) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const shopId = decoded.shopId || decoded.id;
    const { searchParams } = new URL(request.url);
    const dateId = searchParams.get('id');

    if (!dateId) {
      return NextResponse.json({ error: 'Date ID is required' }, { status: 400 });
    }

    await prisma.shopBlockedDate.delete({
      where: {
        id: dateId,
        shopId: shopId // Ensure shop can only delete their own blocked dates
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing blocked date:', error);
    return NextResponse.json({ error: 'Failed to remove blocked date' }, { status: 500 });
  }
}

// GET - Get all blocked dates for the shop
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded || !['shop', 'manager', 'tech'].includes(decoded.role)) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const shopId = decoded.shopId || decoded.id;

    const blockedDates = await prisma.shopBlockedDate.findMany({
      where: {
        shopId,
        date: { gte: new Date() }
      },
      orderBy: { date: 'asc' }
    });

    return NextResponse.json({ blockedDates });
  } catch (error) {
    console.error('Error fetching blocked dates:', error);
    return NextResponse.json({ error: 'Failed to fetch blocked dates' }, { status: 500 });
  }
}
