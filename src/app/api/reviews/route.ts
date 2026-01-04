import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// GET - Get reviews
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shopId');
    const customerId = searchParams.get('customerId');

    const where: any = {};
    if (shopId) where.shopId = shopId;
    if (customerId) where.customerId = customerId;

    const reviews = await prisma.review.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        shop: {
          select: {
            id: true,
            shopName: true,
          },
        },
        workOrder: {
          select: {
            id: true,
            serviceLocation: true,
            vehicleType: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ reviews });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create review
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'customer') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { workOrderId, shopId, rating, comment } = body;

    if (!workOrderId || !shopId || !rating) {
      return NextResponse.json(
        { error: 'Work order ID, shop ID, and rating are required' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Verify work order belongs to customer
    const workOrder = await prisma.workOrder.findUnique({
      where: { id: workOrderId },
    });

    if (!workOrder) {
      return NextResponse.json({ error: 'Work order not found' }, { status: 404 });
    }

    if (workOrder.customerId !== decoded.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if already reviewed
    const existingReview = await prisma.review.findFirst({
      where: {
        workOrderId,
        customerId: decoded.id,
      },
    });

    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this work order' },
        { status: 400 }
      );
    }

    const review = await prisma.review.create({
      data: {
        customerId: decoded.id,
        shopId,
        workOrderId,
        rating,
        comment: comment || null,
      },
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        shop: {
          select: {
            shopName: true,
          },
        },
      },
    });

    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
