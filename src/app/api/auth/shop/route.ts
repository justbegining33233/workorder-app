import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { generateAccessToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password required' }, { status: 400 });
    }

    // Find shop by username, email, or shop name
    const shop = await prisma.shop.findFirst({
      where: {
        AND: [
          {
            OR: [
              { username: username },
              { email: username },
              { shopName: username },
            ],
          },
          { status: 'approved' }, // Only approved shops can login
        ],
      },
    });

    if (!shop) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (!shop.password) {
      return NextResponse.json({ error: 'Account not fully set up. Please contact support.' }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, shop.password);

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Generate access token
    const accessToken = generateAccessToken({ id: shop.id, username: shop.username, role: 'shop' });

    const response = NextResponse.json({
      id: shop.id,
      username: shop.username,
      shopName: shop.shopName,
      email: shop.email,
      phone: shop.phone,
      profileComplete: shop.profileComplete,
      status: shop.status,
      accessToken,
    }, { status: 200 });

    return response;
  } catch (error: any) {
    console.error('Shop login error:', error);
    return NextResponse.json({ error: 'Login failed', details: error?.message }, { status: 500 });
  }
}
