import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

// Reward tiers: points threshold → reward definition
const REWARD_TIERS = [
  { id: 'tier-1', name: '$10 Off Next Service', value: '$10', description: 'Redeem for $10 off any service at a FixTray shop.', pointCost: 200 },
  { id: 'tier-2', name: 'Free Oil Change', value: 'Free', description: 'Redeem for a complimentary standard oil change (up to $45 value).', pointCost: 500 },
  { id: 'tier-3', name: '$25 Off Any Repair', value: '$25', description: 'Redeem for $25 off any repair service over $75.', pointCost: 750 },
  { id: 'tier-4', name: 'Free Annual Inspection', value: 'Free', description: 'Redeem for a complimentary annual vehicle inspection.', pointCost: 1000 },
];

export async function GET(request: NextRequest) {
  const auth = requireRole(request, ['customer']);
  if (auth instanceof NextResponse) return auth;

  try {
    const customerId = auth.id;

    const [workOrders, existingClaims] = await Promise.all([
      prisma.workOrder.findMany({
        where: { customerId },
        select: { status: true, completedAt: true, amountPaid: true, estimatedCost: true },
      }),
      prisma.rewardClaim.findMany({
        where: { customerId },
        select: { tierId: true, status: true, claimedAt: true, redeemedAt: true, expiresAt: true },
      }),
    ]);

    const completed = workOrders.filter(w =>
      ['closed', 'completed', 'Completed'].includes(w.status)
    );

    const loyaltyPoints = completed.length * 50;

    // Map of tierId → most recent active claim
    const claimMap = new Map<string, typeof existingClaims[0]>();
    for (const claim of existingClaims) {
      const existing = claimMap.get(claim.tierId);
      if (!existing || claim.claimedAt > existing.claimedAt) {
        claimMap.set(claim.tierId, claim);
      }
    }

    const now = new Date();
    const rewards = REWARD_TIERS.map(tier => {
      const claim = claimMap.get(tier.id);
      const activeClaim = claim && claim.status !== 'expired' && claim.expiresAt > now ? claim : null;

      return {
        ...tier,
        expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        earned: loyaltyPoints >= tier.pointCost,
        claimed: !!activeClaim,
        claimStatus: activeClaim?.status ?? null,
        claimedAt: activeClaim ? activeClaim.claimedAt.toLocaleDateString() : null,
        redeemedAt: activeClaim?.redeemedAt ? activeClaim.redeemedAt.toLocaleDateString() : null,
        progress: Math.min(loyaltyPoints, tier.pointCost),
        total: tier.pointCost,
      };
    });

    // History: one entry per completed work order
    const history = completed.slice(0, 10).map((w, i) => ({
      id: `entry-${i}`,
      description: 'Completed service',
      points: 50,
      date: w.completedAt ? new Date(w.completedAt).toLocaleDateString() : 'N/A',
    }));

    return NextResponse.json({ loyaltyPoints, rewards, history });
  } catch (error) {
    console.error('Error fetching customer rewards:', error);
    return NextResponse.json({ error: 'Failed to fetch rewards' }, { status: 500 });
  }
}

// POST /api/customers/rewards  — claim a reward
export async function POST(request: NextRequest) {
  const auth = requireRole(request, ['customer']);
  if (auth instanceof NextResponse) return auth;

  try {
    const { tierId } = await request.json();
    const tier = REWARD_TIERS.find(t => t.id === tierId);
    if (!tier) return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });

    const customerId = auth.id;

    // Check loyalty points
    const woCount = await prisma.workOrder.count({
      where: {
        customerId,
        status: { in: ['closed', 'completed', 'Completed'] },
      },
    });
    const loyaltyPoints = woCount * 50;
    if (loyaltyPoints < tier.pointCost) {
      return NextResponse.json({ error: 'Not enough points' }, { status: 400 });
    }

    // Prevent duplicate active claims
    const existing = await prisma.rewardClaim.findFirst({
      where: {
        customerId,
        tierId,
        status: { not: 'expired' },
        expiresAt: { gt: new Date() },
      },
    });
    if (existing) {
      return NextResponse.json({ error: 'You already have an active claim for this reward' }, { status: 409 });
    }

    const claim = await prisma.rewardClaim.create({
      data: {
        customerId,
        tierId,
        status: 'pending',
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    });

    return NextResponse.json({ success: true, claim }, { status: 201 });
  } catch (error) {
    console.error('Error claiming reward:', error);
    return NextResponse.json({ error: 'Failed to claim reward' }, { status: 500 });
  }
}


export async function GET(request: NextRequest) {
  const auth = requireRole(request, ['customer']);
  if (auth instanceof NextResponse) return auth;

  try {
    const customerId = auth.id;

    const workOrders = await prisma.workOrder.findMany({
      where: { customerId },
      select: { status: true, completedAt: true, amountPaid: true, estimatedCost: true },
    });

    const completed = workOrders.filter(w =>
      ['closed', 'completed', 'Completed'].includes(w.status)
    );

    const loyaltyPoints = completed.length * 50;

    // Generate reward list with earned/locked state
    const rewards = REWARD_TIERS.map(tier => ({
      ...tier,
      expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      earned: loyaltyPoints >= tier.pointCost,
      claimed: false, // Placeholder — a real implementation would track claims in DB
      progress: Math.min(loyaltyPoints, tier.pointCost),
      total: tier.pointCost,
    }));

    // History: one entry per completed work order (simple log)
    const history = completed.slice(0, 10).map((w, i) => ({
      id: `entry-${i}`,
      description: 'Completed service',
      points: 50,
      date: w.completedAt ? new Date(w.completedAt).toLocaleDateString() : 'N/A',
    }));

    return NextResponse.json({ loyaltyPoints, rewards, history });
  } catch (error) {
    console.error('Error fetching customer rewards:', error);
    return NextResponse.json({ error: 'Failed to fetch rewards' }, { status: 500 });
  }
}
