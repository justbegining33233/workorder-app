import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string; role: string };
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    if (decoded.role !== 'customer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const customerId = decoded.id;
    const resolvedParams = await params;
    const shopId = resolvedParams.id;

    // Fetch shop details with services, reviews, and favorite status
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      include: {
        services: {
          select: {
            id: true,
            serviceName: true,
            category: true,
            price: true,
            duration: true,
            description: true
          }
        },
        reviews: {
          select: {
            rating: true
          }
        },
        workOrders: {
          where: { status: 'completed' },
          select: { id: true }
        }
      }
    });

    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    // Check if shop is favorited by this customer
    const favorite = await prisma.favoriteShop.findUnique({
      where: {
        customerId_shopId: {
          customerId,
          shopId
        }
      }
    });

    // Calculate average rating and total reviews
    const totalReviews = shop.reviews.length;
    const averageRating = totalReviews > 0
      ? shop.reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
      : 0;

    // Format the response
    const shopDetails = {
      id: shop.id,
      shopName: shop.shopName,
      ownerName: shop.ownerName,
      email: shop.email,
      phone: shop.phone,
      address: shop.address,
      city: shop.city,
      state: shop.state,
      zipCode: shop.zipCode,
      shopType: shop.shopType,
      capacity: shop.capacity,
      slotDuration: shop.slotDuration,
      services: shop.services,
      completedJobs: shop.workOrders.length,
      averageRating,
      totalReviews,
      isFavorite: !!favorite
    };

    return NextResponse.json({ shop: shopDetails });
  } catch (error) {
    console.error('Error fetching shop details:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}