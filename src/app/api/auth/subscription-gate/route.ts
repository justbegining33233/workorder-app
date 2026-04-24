import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getShopSubscriptionGateStatus } from '@/lib/subscription.server';
import { SUBSCRIPTION_PLANS, type SubscriptionPlan } from '@/lib/subscription';

export async function GET(request: NextRequest) {
  try {
    const token =
      request.headers.get('authorization')?.replace('Bearer ', '') ||
      request.cookies.get('sos_auth')?.value;

    if (!token) {
      return NextResponse.json({ allowed: false, reason: 'unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token) as
      | { id?: string; role?: string; shopId?: string }
      | null;

    if (!decoded?.role) {
      return NextResponse.json({ allowed: false, reason: 'unauthorized' }, { status: 401 });
    }

    if (!['shop', 'manager', 'tech'].includes(decoded.role)) {
      return NextResponse.json({ allowed: true, reason: 'not_shop_role' }, { status: 200 });
    }

    const shopId = decoded.role === 'shop' ? (decoded.shopId || decoded.id) : decoded.shopId;
    if (!shopId) {
      return NextResponse.json({ allowed: false, reason: 'missing_shop_id' }, { status: 400 });
    }

    const gate = await getShopSubscriptionGateStatus(shopId);
    const plan = gate.plan as SubscriptionPlan | null;
    const features = plan && SUBSCRIPTION_PLANS[plan] ? SUBSCRIPTION_PLANS[plan].features : null;

    return NextResponse.json(
      {
        allowed: gate.allowed,
        reason: gate.reason,
        status: gate.status,
        plan,
        features,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch (error) {
    console.error('Subscription gate check failed:', error);
    return NextResponse.json({ allowed: false, reason: 'gate_check_failed' }, { status: 500 });
  }
}
