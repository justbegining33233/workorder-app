import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { createCoupon, listCoupons } from '@/lib/stripe';

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  // Only super admins can manage coupons
  if (auth.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const coupons = await listCoupons();
    return NextResponse.json({ coupons: coupons.data });
  } catch (error) {
    console.error('Error fetching coupons:', error);
    return NextResponse.json(
      { error: 'Failed to fetch coupons' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  // Only super admins can create coupons
  if (auth.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const body = await request.json();

    const coupon = await createCoupon({
      id: body.id,
      name: body.name,
      percentOff: body.percentOff,
      amountOff: body.amountOff,
      duration: body.duration,
      durationInMonths: body.durationInMonths,
      maxRedemptions: body.maxRedemptions,
      redeemBy: body.redeemBy ? new Date(body.redeemBy) : undefined,
    });

    return NextResponse.json({ coupon });
  } catch (error) {
    console.error('Error creating coupon:', error);
    return NextResponse.json(
      { error: 'Failed to create coupon' },
      { status: 500 }
    );
  }
}