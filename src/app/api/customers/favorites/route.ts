import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// GET - Get favorite shops
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'customer') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const favorites = await prisma.favoriteShop.findMany({
      where: { customerId: decoded.id },
      include: {
        // We can't include shop directly since we only store shopId
        // Frontend will need to fetch shop details separately
      },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch shop details for each favorite
    const shopsDetails = await Promise.all(
      favorites.map(async (fav) => {
        const shop = await prisma.shop.findUnique({
          where: { id: fav.shopId },
          select: {
            id: true,
            shopName: true,
            email: true,
            phone: true,
            address: true,
            city: true,
            state: true,
            zipCode: true,
            shopType: true,
            services: {
              select: {
                serviceName: true,
                category: true,
              },
            },
          },
        });
        return {
          favoriteId: fav.id,
          createdAt: fav.createdAt,
          shop,
        };
      })
    );

    return NextResponse.json({ favorites: shopsDetails });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Add favorite shop
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
    const { shopId } = body;

    if (!shopId) {
      return NextResponse.json({ error: 'Shop ID is required' }, { status: 400 });
    }

    // Verify shop exists
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
    });

    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    // Check if already favorited
    const existing = await prisma.favoriteShop.findUnique({
      where: {
        customerId_shopId: {
          customerId: decoded.id,
          shopId,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ error: 'Shop already in favorites' }, { status: 400 });
    }

    const favorite = await prisma.favoriteShop.create({
      data: {
        customerId: decoded.id,
        shopId,
      },
    });

    return NextResponse.json({ favorite }, { status: 201 });
  } catch (error) {
    console.error('Error adding favorite:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
